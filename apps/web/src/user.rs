use crate::api::FailedResponse;
use crate::token::delete_token_by_username;
use crate::utils::{acquire_read_lock, acquire_write_lock, current_time, permission_match, sha256};
use crate::MAIN_DIR_NAME;
use actix_web::HttpResponse;
use log::{error, info};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::Error;
use std::path::Path;
use std::sync::{Arc, RwLock};

#[derive(Serialize, Deserialize, Clone)]
pub struct User {
    pub username: String,
    pub info: UserInfo,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct UserInfo {
    pub created_at: u128,
    pub password: String, // SHA256哈希后的密码
    pub permissions: Vec<String>,
}

#[derive(Deserialize)]
pub struct UserInput {
    pub username: String,
    pub password: String, // 明文密码
    pub permissions: Vec<String>,
}

#[derive(Serialize, Debug)]
pub struct UserOutput {
    pub created_at: u128,
    pub username: String,
    pub permissions: Vec<String>,
}

impl User {
    pub fn to_output(&self) -> UserOutput {
        UserOutput {
            created_at: self.info.created_at,
            username: self.username.clone(),
            permissions: self.info.permissions.clone(),
        }
    }

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

        for user_permission in &self.info.permissions {
            if permission_match(user_permission, permission) {
                return Ok(true);
            }
        }

        Ok(false)
    }
}

const USERS_FILE_NAME: &str = "users.json";

lazy_static::lazy_static! {
    static ref USERS_CACHE: Arc<RwLock<(Option<HashMap<String, UserInfo>>, u128)>> = Arc::new(RwLock::new((None, 0)));
}

pub fn load_users() -> Result<(), Error> {
    let users_file = Path::new(MAIN_DIR_NAME).join(USERS_FILE_NAME);

    if !users_file.exists() {
        let default_users = HashMap::<String, UserInfo>::new();
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

    let users: HashMap<String, UserInfo> = serde_json::from_str(&users_json).map_err(|e| {
        error!(
            "Failed to parse users file at {}: {}",
            users_file.display(),
            e
        );
        e
    })?;

    let mut cache = USERS_CACHE.write().map_err(|e| {
        error!("Failed to acquire write lock: {}", e);
        Error::new(std::io::ErrorKind::Other, "Failed to acquire lock")
    })?;
    *cache = (Some(users), current_time());

    Ok(())
}

pub fn save_users(cache: &(Option<HashMap<String, UserInfo>>, u128)) -> Result<(), HttpResponse> {
    let users = cache.0.as_ref().expect("Users cache not initialized");
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

pub fn is_user_empty() -> Result<bool, HttpResponse> {
    let cache = acquire_read_lock(&USERS_CACHE)?;
    Ok(cache
        .0
        .as_ref()
        .expect("Users cache not initialized")
        .is_empty())
}

pub fn get_users() -> Result<Vec<User>, HttpResponse> {
    let cache = acquire_read_lock(&USERS_CACHE)?;
    Ok(cache
        .0
        .as_ref()
        .expect("Users cache not initialized")
        .iter()
        .map(|(username, info)| User {
            username: username.clone(),
            info: info.clone(),
        })
        .collect())
}

pub fn add_user(user_input: UserInput) -> Result<(), HttpResponse> {
    let mut cache = acquire_write_lock(&USERS_CACHE)?;
    let users = cache.0.as_mut().expect("Users cache not initialized");

    if users.contains_key(&user_input.username) {
        return Err(HttpResponse::Conflict().json(FailedResponse {
            status: "failed",
            err: "username-exists",
        }));
    }

    let user = User {
        username: user_input.username.clone(),
        info: UserInfo {
            created_at: current_time(),
            password: sha256(&user_input.password),
            permissions: user_input.permissions,
        },
    };

    users.insert(user_input.username, user.info.clone());
    cache.1 = current_time();

    save_users(&*cache)?;

    info!("Added new user: {:?}", user.to_output());
    Ok(())
}

pub fn get_user(username: &str) -> Option<User> {
    let cache = USERS_CACHE.read().expect("Failed to acquire read lock");
    cache
        .0
        .as_ref()
        .expect("Users cache not initialized")
        .get(username)
        .cloned()
        .map(|info| User {
            username: username.to_string(),
            info,
        })
}

pub fn update_user(username: &str, user_input: UserInput) -> Result<Option<User>, HttpResponse> {
    let mut cache = acquire_write_lock(&USERS_CACHE)?;
    let users = cache.0.as_mut().expect("Users cache not initialized");

    if !users.contains_key(username) {
        return Err(HttpResponse::NotFound().json(FailedResponse {
            status: "failed",
            err: "user-not-found",
        }));
    }

    if user_input.username != username && users.contains_key(&user_input.username) {
        return Err(HttpResponse::Conflict().json(FailedResponse {
            status: "failed",
            err: "username-exists",
        }));
    }

    let updated_user = User {
        username: user_input.username.clone(),
        info: UserInfo {
            created_at: users.get(username).unwrap().created_at,
            password: sha256(&user_input.password),
            permissions: user_input.permissions,
        },
    };

    if user_input.username != username {
        users.remove(username);
    }
    users.insert(user_input.username.clone(), updated_user.info.clone());
    cache.1 = current_time();

    save_users(&*cache)?;

    info!("Updated user: {:?}", updated_user.to_output());
    Ok(Some(updated_user))
}

pub fn delete_user(username: &str) -> Result<(), HttpResponse> {
    let mut cache = acquire_write_lock(&USERS_CACHE)?;
    let users = cache.0.as_mut().expect("Users cache not initialized");

    if users.remove(username).is_none() {
        return Err(HttpResponse::NotFound().json(FailedResponse {
            status: "failed",
            err: "user-not-found",
        }));
    }
    cache.1 = current_time();

    save_users(&*cache)?;

    delete_token_by_username(username)?;

    info!("Deleted user with username {}", username);
    Ok(())
}

pub fn verify_password(name: &str, password: &str) -> Result<User, HttpResponse> {
    match get_user(name) {
        Some(user) => {
            let hashed_password = sha256(password);
            if hashed_password != user.info.password {
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
