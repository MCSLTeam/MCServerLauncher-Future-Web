use crate::api::FailedResponse;
use crate::user::{get_user, User};
use crate::utils::{acquire_read_lock, acquire_write_lock, current_time, generate_random_string};
use crate::MAIN_DIR_NAME;
use actix_web::{HttpRequest, HttpResponse};
use log::{error, info};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::Error;
use std::path::Path;
use std::sync::{Arc, RwLock};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SessionInfo {
    pub user: String,
    pub token_id: String,
    pub remember: bool,
    pub user_agent: String,
    pub last_active_ip: String,
    pub last_active_at: u128,
    pub created_at: u128,
}

#[derive(Serialize, Deserialize)]
pub struct SessionStorage {
    pub user: String,
    pub token_id: String,
    pub user_agent: String,
    pub last_active_ip: String,
    pub last_active_at: u128,
    pub created_at: u128,
}

fn session_info_to_storage(info: SessionInfo) -> SessionStorage {
    SessionStorage {
        user: info.user,
        token_id: info.token_id,
        user_agent: info.user_agent,
        last_active_ip: info.last_active_ip,
        last_active_at: info.last_active_at,
        created_at: info.created_at,
    }
}

fn session_storage_to_info(storage: SessionStorage) -> SessionInfo {
    SessionInfo {
        user: storage.user,
        token_id: storage.token_id,
        remember: false,
        user_agent: storage.user_agent,
        last_active_ip: storage.last_active_ip,
        last_active_at: storage.last_active_at,
        created_at: storage.created_at,
    }
}

const TOKENS_FILE_NAME: &str = "user_tokens.json";
const TEMP_TOKEN_EXPIRE_MILLIS: u128 = 24 * 60 * 60 * 1000;

lazy_static::lazy_static! {
    static ref TOKENS_CACHE: Arc<RwLock<(Option<HashMap<String, SessionInfo>>, u128)>> = Arc::new(RwLock::new((None, 0)));
}

pub fn load_tokens() -> Result<(), Error> {
    let tokens_file = Path::new(MAIN_DIR_NAME).join(TOKENS_FILE_NAME);

    if !tokens_file.exists() {
        let default_tokens = HashMap::<String, SessionInfo>::new();
        let tokens_json = serde_json::to_string_pretty(&default_tokens)?;

        fs::write(&tokens_file, tokens_json).map_err(|e| {
            error!(
                "Failed to create tokens file at {}: {}",
                tokens_file.display(),
                e
            );
            e
        })?;

        info!("Created new tokens file at {}", tokens_file.display());
    }

    let tokens_json = fs::read_to_string(&tokens_file).map_err(|e| {
        error!(
            "Failed to read tokens file at {}: {}",
            tokens_file.display(),
            e
        );
        e
    })?;

    let tokens: HashMap<String, SessionStorage> =
        serde_json::from_str(&tokens_json).map_err(|e| {
            error!(
                "Failed to parse tokens file at {}: {}",
                tokens_file.display(),
                e
            );
            e
        })?;

    let mut cache = TOKENS_CACHE.write().map_err(|e| {
        error!("Failed to acquire write lock: {}", e);
        Error::new(std::io::ErrorKind::Other, "Failed to acquire lock")
    })?;
    *cache = (
        Some(
            tokens
                .into_iter()
                .map(|(k, v)| (k, session_storage_to_info(v)))
                .collect(),
        ),
        current_time(),
    );

    Ok(())
}

pub fn save_tokens(
    cache: &(Option<HashMap<String, SessionInfo>>, u128),
) -> Result<(), HttpResponse> {
    let tokens = cache.0.as_ref().expect("Tokens cache not initialized");

    let tokens_file = Path::new(MAIN_DIR_NAME).join(TOKENS_FILE_NAME);
    let tokens_json = serde_json::to_string_pretty(
        &tokens
            .iter()
            .filter(|(_, token_info)| token_info.remember)
            .map(|(k, v)| (k.clone(), session_info_to_storage(v.clone())))
            .collect::<HashMap<_, _>>(),
    )
    .map_err(|e| {
        error!(
            "Failed to serialize tokens file at {}: {}",
            tokens_file.display(),
            e
        );
        HttpResponse::InternalServerError().json(FailedResponse {
            status: "failed",
            err: "internal-server-error",
        })
    })?;

    fs::write(&tokens_file, tokens_json).map_err(|e| {
        error!(
            "Failed to write tokens file at {}: {}",
            tokens_file.display(),
            e
        );
        HttpResponse::InternalServerError().json(FailedResponse {
            status: "failed",
            err: "internal-server-error",
        })
    })?;

    Ok(())
}

pub fn get_session_infos() -> Result<Vec<SessionInfo>, HttpResponse> {
    let cache = acquire_read_lock(&TOKENS_CACHE)?;
    let tokens = cache
        .0
        .as_ref()
        .expect("Tokens cache not initialized")
        .clone();

    Ok(tokens.into_values().collect())
}

pub fn create_session(
    username: &str,
    remember: bool,
    ip: String,
    user_agent: String,
) -> Result<String, HttpResponse> {
    let mut cache = acquire_write_lock(&TOKENS_CACHE)?;
    let tokens = cache.0.as_mut().expect("Tokens cache not initialized");

    let mut token;
    loop {
        token = generate_random_string(32);

        if !tokens.contains_key(&token) {
            break;
        }
    }

    let mut token_id;
    loop {
        token_id = generate_random_string(32);

        if tokens
            .iter()
            .all(|(_, token_info)| token_info.token_id != token_id)
        {
            break;
        }
    }

    let current_time = current_time();

    let token_info = SessionInfo {
        user: username.to_string(),
        token_id,
        remember,
        user_agent,
        last_active_ip: ip,
        last_active_at: current_time,
        created_at: current_time,
    };

    tokens.insert(token.clone(), token_info.clone());
    cache.1 = current_time;

    save_tokens(&*cache)?;

    info!("User logged in with new session: {:?}", token_info);
    Ok(token)
}

pub fn delete_token(token: &str) -> Result<(), HttpResponse> {
    let mut cache = acquire_write_lock(&TOKENS_CACHE)?;
    let tokens = cache.0.as_mut().expect("Tokens cache not initialized");
    match tokens.remove(token) {
        Some(token) => {
            cache.1 = current_time();
            save_tokens(&*cache)?;

            info!("User {} deleted session {}", token.user, token.token_id);
            Ok(())
        }
        None => Err(HttpResponse::NotFound().json(FailedResponse {
            status: "failed",
            err: "session-not-found",
        })),
    }
}

pub fn delete_token_by_id(token_id: &str) -> Result<(), HttpResponse> {
    let mut cache = acquire_write_lock(&TOKENS_CACHE)?;
    let tokens = cache.0.as_mut().expect("Tokens cache not initialized");

    let token = tokens
        .iter()
        .find(|(_, token_info)| token_info.token_id == token_id)
        .map(|(token, _)| token.clone());

    if token.is_none() {
        return Err(HttpResponse::NotFound().json(FailedResponse {
            status: "failed",
            err: "session-not-found",
        }));
    }

    let token = token.unwrap();

    tokens.remove(&token);
    cache.1 = current_time();

    save_tokens(&*cache)?;

    info!("User {} deleted session {}", token_id, token);
    Ok(())
}

pub fn delete_token_by_username(username: &str) -> Result<(), HttpResponse> {
    let mut cache = acquire_write_lock(&TOKENS_CACHE)?;
    let tokens = cache.0.as_mut().expect("Tokens cache not initialized");

    let tokens_to_delete: Vec<String> = tokens
        .iter()
        .filter(|(_, token_info)| token_info.user == username)
        .map(|(token, _)| token.clone())
        .collect();

    tokens_to_delete.iter().for_each(|token| {
        tokens.remove(token);
    });
    cache.1 = current_time();

    save_tokens(&*cache)?;

    Ok(())
}

pub fn get_session_info_by_id(token_id: &str) -> Result<SessionInfo, HttpResponse> {
    let cache = acquire_read_lock(&TOKENS_CACHE)?;
    let tokens = cache.0.as_ref().expect("Tokens cache not initialized");

    let token_info = tokens
        .iter()
        .find(|(_, token_info)| token_info.token_id == token_id)
        .map(|(_, token_info)| token_info.clone());

    if token_info.is_none() {
        return Err(HttpResponse::NotFound().json(FailedResponse {
            status: "failed",
            err: "session-not-found",
        }));
    }

    Ok(token_info.unwrap().clone())
}

pub fn get_tokens_by_user(user: &User) -> Result<Vec<SessionInfo>, HttpResponse> {
    let cache = acquire_read_lock(&TOKENS_CACHE)?;
    let tokens = cache.0.as_ref().expect("Tokens cache not initialized");

    let token_infos = tokens
        .iter()
        .filter(|(_, token_info)| token_info.user == user.username)
        .map(|(_, token_info)| token_info.clone())
        .collect::<Vec<SessionInfo>>();

    Ok(token_infos)
}

pub fn update_token_info(token: &str, req: &HttpRequest, ip: &str) {
    match TOKENS_CACHE.write() {
        Ok(mut cache) => {
            let tokens = cache.0.as_mut().expect("Tokens cache not initialized");

            if let Some(token_info) = tokens.get_mut(token) {
                token_info.user_agent = req
                    .headers()
                    .get("User-Agent")
                    .unwrap()
                    .to_str()
                    .unwrap_or("unknown")
                    .to_string();
                token_info.last_active_ip = ip.to_string();
                token_info.last_active_at = current_time();
            }
        }
        Err(e) => {
            error!("Failed to acquire write lock: {}", e);
        }
    }
}

pub fn get_user_by_token(token: &str) -> Result<User, HttpResponse> {
    let mut cache = acquire_write_lock(&TOKENS_CACHE)?;
    let tokens = cache.0.as_mut().expect("Tokens cache not initialized");

    let token_info = tokens.get(token);

    if token_info.is_none() {
        return Err(HttpResponse::NotFound().json(FailedResponse {
            status: "failed",
            err: "invalid-token",
        }));
    }

    let token_info = token_info.unwrap();
    let user = get_user(token_info.user.as_ref());

    if (!token_info.remember && token_info.created_at + TEMP_TOKEN_EXPIRE_MILLIS < current_time())
        || user.is_none()
    {
        tokens.remove(token);
        cache.1 = current_time();
        save_tokens(&*cache)?;
        return Err(HttpResponse::NotFound().json(FailedResponse {
            status: "failed",
            err: "invalid-token",
        }));
    }

    Ok(user.unwrap())
}

pub fn cleanup_expired_tokens() -> Result<usize, HttpResponse> {
    let mut cache = acquire_write_lock(&TOKENS_CACHE)?;
    let tokens = cache.0.as_mut().expect("Tokens cache not initialized");

    let current_time = current_time();
    let tokens_to_delete: Vec<(String, SessionInfo)> = tokens
        .iter()
        .filter(|(_, token_info)| {
            let user = get_user(token_info.user.as_ref());
            (!token_info.remember
                && token_info.created_at + TEMP_TOKEN_EXPIRE_MILLIS < current_time)
                || user.is_none()
        })
        .map(|(token, token_info)| (token.clone(), token_info.clone()))
        .collect();

    let deleted_permanent_count = tokens_to_delete
        .iter()
        .filter(|(_, token_info)| token_info.remember)
        .count();

    tokens_to_delete.iter().for_each(|(token, _)| {
        tokens.remove(token);
    });

    if deleted_permanent_count > 0 {
        cache.1 = current_time;
        save_tokens(&*cache)?;
    }

    Ok(deleted_permanent_count)
}
