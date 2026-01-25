use crate::api::FailedResponse;
use crate::utils::sha256;
use crate::MAIN_DIR_NAME;
use actix_web::HttpResponse;
use log::{error, info};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Error;
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct User {
    pub id: u32,
    pub name: String,
    pub password: String, // SHA256哈希后的密码
    pub permissions: Vec<String>,
}

#[derive(Deserialize)]
pub struct UserInput {
    pub name: String,
    pub password: String, // 明文密码
    pub permissions: Vec<String>,
}

#[derive(Serialize)]
pub struct UserOutput {
    pub id: u32,
    pub name: String,
    pub permissions: Vec<String>,
}

const USERS_FILE_NAME: &str = "users.json";

lazy_static::lazy_static! {
    static ref USERS_CACHE: Arc<Mutex<(Option<Vec<User>>, u64)>> = Arc::new(Mutex::new((None, 0)));
}

pub fn load_users(main_dir: &Path) -> Result<(), Error> {
    let users_file = main_dir.join(USERS_FILE_NAME);

    if !users_file.exists() {
        let default_users = Vec::<User>::new();
        let users_json = serde_json::to_string_pretty(&default_users)?;

        fs::write(&users_file, users_json).map_err(|e| {
            error!(
                "Failed to create users file at {}: {}",
                users_file.display(),
                e
            );
            e
        })?;

        info!("Created new users file at {}", users_file.display());
    }

    let users_json = fs::read_to_string(&users_file).map_err(|e| {
        error!(
            "Failed to read users file at {}: {}",
            users_file.display(),
            e
        );
        e
    })?;

    let users = serde_json::from_str(&users_json).map_err(|e| {
        error!(
            "Failed to parse users file at {}: {}",
            users_file.display(),
            e
        );
        e
    })?;

    set_user_cache(users);

    Ok(())
}

pub fn get_users() -> Vec<User> {
    let cache = USERS_CACHE.lock().unwrap();
    cache.0.as_ref().unwrap().to_vec()
}

fn set_user_cache(users: Vec<User>) {
    let mut cache = USERS_CACHE.lock().unwrap();
    let current_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    *cache = (Some(users.clone()), current_time);
}

pub fn set_users(users: &Vec<User>) -> Result<(), HttpResponse> {
    set_user_cache(users.clone());

    let users_file = Path::new(MAIN_DIR_NAME).join(USERS_FILE_NAME);
    let users_json = serde_json::to_string_pretty(users).map_err(|e| {
        error!(
            "Failed to serialize users file at {}: {}",
            users_file.display(),
            e
        );
        HttpResponse::InternalServerError().json(FailedResponse {
            status: "failed",
            err: "internal-server-error",
        })
    })?;

    fs::write(&users_file, users_json).map_err(|e| {
        error!(
            "Failed to write users file at {}: {}",
            users_file.display(),
            e
        );
        HttpResponse::InternalServerError().json(FailedResponse {
            status: "failed",
            err: "internal-server-error",
        })
    })?;

    Ok(())
}

pub fn add_user(user_input: UserInput) -> Result<(), HttpResponse> {
    let mut users = get_users();

    if users.iter().any(|u| u.name == user_input.name) {
        return Err(HttpResponse::Conflict().json(FailedResponse {
            status: "failed",
            err: "username-exists",
        }));
    }

    let new_id = users.iter().map(|u| u.id).max().unwrap_or(0) + 1;

    let new_user = User {
        id: new_id,
        name: user_input.name,
        password: sha256(&user_input.password),
        permissions: user_input.permissions,
    };

    users.push(new_user.clone());

    set_users(&users)?;

    info!("Added new user: {:?}", new_user);
    Ok(())
}

pub fn get_user_by_id(id: u32) -> Option<User> {
    let users = get_users();
    users.into_iter().find(|u| u.id == id)
}

pub fn get_user_by_name(name: &str) -> Option<User> {
    let users = get_users();
    users.into_iter().find(|u| u.name == name)
}

pub fn update_user(id: u32, user_input: UserInput) -> Result<Option<User>, HttpResponse> {
    let mut users = get_users();

    match users.iter().position(|u| u.id == id) {
        Some(user_index) => {
            if users
                .iter()
                .any(|u| u.name == user_input.name && u.id != id)
            {
                return Err(HttpResponse::Conflict().json(FailedResponse {
                    status: "failed",
                    err: "username-exists",
                }));
            }

            let updated_user = User {
                id,
                name: user_input.name,
                password: sha256(&user_input.password),
                permissions: user_input.permissions,
            };

            users[user_index] = updated_user.clone();
            set_users(&users)?;

            info!("Updated user: {:?}", updated_user);
            Ok(Some(updated_user))
        }
        None => Err(HttpResponse::NotFound().json(FailedResponse {
            status: "failed",
            err: "user-not-found",
        })),
    }
}

pub fn delete_user(id: u32) -> Result<(), HttpResponse> {
    let mut users = get_users();
    let original_count = users.len();

    users.retain(|u| u.id != id);

    if users.len() < original_count {
        set_users(&users)?;
        info!("Deleted user with id {}", id);
        Ok(())
    } else {
        Err(HttpResponse::NotFound().json(FailedResponse {
            status: "failed",
            err: "user-not-found",
        }))
    }
}

pub fn verify_password(name: &str, password: &str) -> Result<User, HttpResponse> {
    match get_user_by_name(name) {
        Some(user) => {
            let hashed_password = sha256(password);
            if hashed_password != user.password {
                return Err(HttpResponse::Unauthorized().json(FailedResponse {
                    status: "failed",
                    err: "login-failed",
                }));
            }
            Ok(user)
        }
        None => Err(HttpResponse::Unauthorized().json(FailedResponse {
            status: "failed",
            err: "login-failed",
        })),
    }
}

impl User {
    pub fn verify_permission(&self, permission: &str) -> Result<bool, HttpResponse> {
        let permission_regex = regex::Regex::new(
            r"^(([a-zA-Z-_]+|\*{1,2})\.)*([a-zA-Z-_]+|\*{1,2})$",
        )
        .map_err(|_| {
            HttpResponse::InternalServerError().json(FailedResponse {
                status: "failed",
                err: "internal-server-error",
            })
        })?;

        if !permission_regex.is_match(permission) {
            return Ok(false);
        }

        for user_permission in &self.permissions {
            if self.permission_match(user_permission, permission) {
                return Ok(true);
            }
        }

        Ok(false)
    }

    fn permission_match(&self, user_permission: &str, matching_permission: &str) -> bool {
        let mut pattern = user_permission
            .replace('.', "\\.")
            .replace("**", ".+")
            .replace("*", "[^\"]+");

        pattern.push_str("(\\..+)?");

        let regex = regex::Regex::new(&format!("^{}$", pattern)).unwrap();
        regex.is_match(matching_permission)
    }
}
