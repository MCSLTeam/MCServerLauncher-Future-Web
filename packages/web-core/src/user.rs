use crate::error::{AppError, AppResult};
use crate::token::delete_token_by_username;
use crate::utils::{
    acquire_read_lock, acquire_write_lock, current_time, generate_random_string, permission_match,
    sha256,
};
use crate::MAIN_DIR_NAME;
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
    pub password: String,
    pub permissions: Vec<String>,
}

#[derive(Deserialize, Clone)]
pub struct UserInput {
    pub username: String,
    pub password: String,
    pub permissions: Vec<String>,
}

#[derive(Serialize, Debug, Clone)]
pub struct UserOutput {
    pub username: String,
    pub permissions: Vec<String>,
    pub created_at: u128,
}

impl User {
    pub fn to_output(&self) -> UserOutput {
        UserOutput {
            username: self.username.clone(),
            permissions: self.info.permissions.clone(),
            created_at: self.info.created_at,
        }
    }

    pub fn verify_permission(&self, permission: &str) -> AppResult<bool> {
        let permission_regex =
            regex::Regex::new(r"^(([a-zA-Z-_]+|\*{1,2})\.)*([a-zA-Z-_]+|\*{1,2})$")
                .map_err(|_| AppError::internal())?;

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

    pub fn verify_password(&self, password: &str) -> AppResult<()> {
        if sha256(password) == self.info.password {
            Ok(())
        } else {
            Err(AppError::unauthorized("login-failed"))
        }
    }
}

const USERS_FILE_NAME: &str = "users.json";

type UsersCache = Arc<RwLock<(Option<HashMap<String, UserInfo>>, u128)>>;

lazy_static::lazy_static! {
    static ref USERS_CACHE: UsersCache = Arc::new(RwLock::new((None, 0)));
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
        Error::new(std::io::ErrorKind::InvalidData, e)
    })?;

    let mut cache = USERS_CACHE.write().map_err(|e| {
        error!("Failed to acquire write lock: {e}");
        Error::other("Failed to acquire lock")
    })?;
    *cache = (Some(users), current_time());

    Ok(())
}

pub fn save_users(cache: &(Option<HashMap<String, UserInfo>>, u128)) -> AppResult<()> {
    let users = cache.0.as_ref().expect("Users cache not initialized");
    let users_file = Path::new(MAIN_DIR_NAME).join(USERS_FILE_NAME);
    let users_json = serde_json::to_string_pretty(users).map_err(|e| {
        error!(
            "Failed to serialize users file at {}: {}",
            users_file.display(),
            e
        );
        AppError::internal()
    })?;

    fs::write(&users_file, users_json).map_err(|e| {
        error!(
            "Failed to write users file at {}: {}",
            users_file.display(),
            e
        );
        AppError::internal()
    })?;

    Ok(())
}

pub fn is_user_empty() -> AppResult<bool> {
    let cache = acquire_read_lock(&USERS_CACHE)?;
    Ok(cache
        .0
        .as_ref()
        .expect("Users cache not initialized")
        .is_empty())
}

pub fn find_local_admin_username() -> AppResult<Option<String>> {
    let users = get_users()?;
    if users.is_empty() {
        return Ok(None);
    }
    for user in &users {
        if user.verify_permission("*").unwrap_or(false)
            || user
                .verify_permission(crate::nodes::PERM_NODE_MANAGE)
                .unwrap_or(false)
        {
            return Ok(Some(user.username.clone()));
        }
    }
    Ok(Some(users[0].username.clone()))
}

pub fn ensure_desktop_admin_username() -> AppResult<String> {
    if let Some(username) = find_local_admin_username()? {
        return Ok(username);
    }
    add_user(UserInput {
        username: "desktop".to_string(),
        password: generate_random_string(32),
        permissions: vec!["*".to_string()],
    })?;
    Ok("desktop".to_string())
}

pub fn get_users() -> AppResult<Vec<User>> {
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

pub fn add_user(user_input: UserInput) -> AppResult<()> {
    let mut cache = acquire_write_lock(&USERS_CACHE)?;
    let users = cache.0.as_mut().expect("Users cache not initialized");

    if users.contains_key(&user_input.username) {
        return Err(AppError::conflict("username-exists"));
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

    save_users(&cache)?;

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

pub fn update_user(username: &str, user_input: UserInput) -> AppResult<Option<User>> {
    let mut cache = acquire_write_lock(&USERS_CACHE)?;
    let users = cache.0.as_mut().expect("Users cache not initialized");

    if !users.contains_key(username) {
        return Err(AppError::not_found("user-not-found"));
    }

    if user_input.username != username && users.contains_key(&user_input.username) {
        return Err(AppError::conflict("username-exists"));
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

    save_users(&cache)?;

    info!("Updated user: {:?}", updated_user.to_output());
    Ok(Some(updated_user))
}

pub fn delete_user(username: &str) -> AppResult<()> {
    let mut cache = acquire_write_lock(&USERS_CACHE)?;
    let users = cache.0.as_mut().expect("Users cache not initialized");

    if users.remove(username).is_none() {
        return Err(AppError::not_found("user-not-found"));
    }
    cache.1 = current_time();

    save_users(&cache)?;

    delete_token_by_username(username)?;

    info!("Deleted user with username {username}");
    Ok(())
}

pub fn verify_password(name: &str, password: &str) -> AppResult<User> {
    match get_user(name) {
        Some(user) => {
            user.verify_password(password)?;
            Ok(user)
        }
        None => Err(AppError::unauthorized("login-failed")),
    }
}
