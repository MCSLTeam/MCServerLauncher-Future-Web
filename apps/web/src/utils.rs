use crate::api::FailedResponse;
use actix_web::HttpResponse;
use log::error;
use rand::RngExt;
use sha2::{Digest, Sha256};
use std::sync::{Arc, RwLock, RwLockReadGuard, RwLockWriteGuard};
use std::time::{SystemTime, UNIX_EPOCH};

pub fn current_time() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("System time before UNIX EPOCH")
        .as_millis()
}

pub fn generate_random_string(length: usize) -> String {
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ\
                            abcdefghijklmnopqrstuvwxyz\
                            0123456789";

    let mut rng = rand::rng();
    (0..length)
        .map(|_| {
            let idx = rng.random_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect()
}

pub fn sha256(str: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(str);
    hex::encode(hasher.finalize())
}

pub fn permission_match(user_permission: &str, matching_permission: &str) -> bool {
    let mut pattern = user_permission
        .replace('.', "\\.")
        .replace("**", ".+")
        .replace("*", "[^\"]+");

    pattern.push_str("(\\..+)?");

    let regex = regex::Regex::new(&format!("^{}$", pattern)).unwrap();
    regex.is_match(matching_permission)
}

pub fn acquire_write_lock<T>(lock: &Arc<RwLock<T>>) -> Result<RwLockWriteGuard<'_, T>, HttpResponse> {
    lock.write().map_err(|e| {
        error!("Failed to acquire write lock: {}", e);
        HttpResponse::InternalServerError().json(FailedResponse {
            status: "failed",
            err: "internal-server-error",
        })
    })
}

pub fn acquire_read_lock<T>(lock: &Arc<RwLock<T>>) -> Result<RwLockReadGuard<'_, T>, HttpResponse> {
    lock.read().map_err(|e| {
        error!("Failed to acquire read lock: {}", e);
        HttpResponse::InternalServerError().json(FailedResponse {
            status: "failed",
            err: "internal-server-error",
        })
    })
}