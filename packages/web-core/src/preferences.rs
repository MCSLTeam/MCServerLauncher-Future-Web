use crate::error::{AppError, AppResult};
use crate::utils::{acquire_read_lock, acquire_write_lock, current_time};
use crate::MAIN_DIR_NAME;
use log::{error, info};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::Error;
use std::path::Path;
use std::sync::{Arc, RwLock};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct UserPreferences {
    #[serde(default = "default_true")]
    pub allow_context_menu: bool,
    #[serde(default = "default_true")]
    pub use_terminal_input: bool,
    #[serde(default = "default_theme")]
    pub theme: String,
    #[serde(default = "default_download_source")]
    pub download_source: String,
    #[serde(default = "default_download_threads")]
    pub download_threads: u32,
    #[serde(default = "default_download_error_action")]
    pub download_error_action: String,
    #[serde(default)]
    pub locale: Option<String>,
    #[serde(default)]
    pub daemon_auto_refresh_enabled: bool,
    #[serde(default = "default_refresh_seconds")]
    pub daemon_auto_refresh_seconds: u32,
    #[serde(default = "default_true")]
    pub auto_accept_mc_java_eula: bool,
    #[serde(default = "default_true")]
    pub auto_disable_mc_java_online_mode: bool,
    #[serde(default = "default_true")]
    pub auto_disable_mc_bedrock_online_mode: bool,
    #[serde(default = "default_true")]
    pub use_mirror_for_forge_install: bool,
    #[serde(default = "default_true")]
    pub use_mirror_for_fabric_install: bool,
    #[serde(default = "default_true")]
    pub use_mirror_for_neoforge_install: bool,
    #[serde(default = "default_true")]
    pub use_mirror_for_quilt_install: bool,
}

fn default_true() -> bool {
    true
}
fn default_theme() -> String {
    "system".into()
}
fn default_download_source() -> String {
    "FastMirror".into()
}
fn default_download_threads() -> u32 {
    16
}
fn default_download_error_action() -> String {
    "stop".into()
}
fn default_refresh_seconds() -> u32 {
    30
}

impl Default for UserPreferences {
    fn default() -> Self {
        Self {
            allow_context_menu: true,
            use_terminal_input: true,
            theme: default_theme(),
            download_source: default_download_source(),
            download_threads: default_download_threads(),
            download_error_action: default_download_error_action(),
            locale: None,
            daemon_auto_refresh_enabled: false,
            daemon_auto_refresh_seconds: default_refresh_seconds(),
            auto_accept_mc_java_eula: true,
            auto_disable_mc_java_online_mode: true,
            auto_disable_mc_bedrock_online_mode: true,
            use_mirror_for_forge_install: true,
            use_mirror_for_fabric_install: true,
            use_mirror_for_neoforge_install: true,
            use_mirror_for_quilt_install: true,
        }
    }
}

const PREFS_FILE_NAME: &str = "preferences.json";

type PreferencesCache = Arc<RwLock<(Option<HashMap<String, UserPreferences>>, u128)>>;

lazy_static::lazy_static! {
    static ref PREFS_CACHE: PreferencesCache = Arc::new(RwLock::new((None, 0)));
}

pub fn load_preferences() -> Result<(), Error> {
    let file = Path::new(MAIN_DIR_NAME).join(PREFS_FILE_NAME);
    if !file.exists() {
        let empty: HashMap<String, UserPreferences> = HashMap::new();
        let json = serde_json::to_string_pretty(&empty)?;
        fs::write(&file, json).map_err(|e| {
            error!(
                "Failed to create preferences file at {}: {}",
                file.display(),
                e
            );
            e
        })?;
        info!("Created new preferences file at {}", file.display());
    }
    let json = fs::read_to_string(&file).map_err(|e| {
        error!(
            "Failed to read preferences file at {}: {}",
            file.display(),
            e
        );
        e
    })?;
    let map: HashMap<String, UserPreferences> = serde_json::from_str(&json).map_err(|e| {
        error!(
            "Failed to parse preferences file at {}: {}",
            file.display(),
            e
        );
        Error::new(std::io::ErrorKind::InvalidData, e)
    })?;
    let mut cache = PREFS_CACHE.write().map_err(|e| {
        error!("Failed to acquire write lock: {e}");
        Error::other("Failed to acquire lock")
    })?;
    *cache = (Some(map), current_time());
    Ok(())
}

fn save_prefs(map: &HashMap<String, UserPreferences>) -> AppResult<()> {
    let file = Path::new(MAIN_DIR_NAME).join(PREFS_FILE_NAME);
    let json = serde_json::to_string_pretty(map).map_err(|e| {
        error!("Failed to serialize preferences: {e}");
        AppError::internal()
    })?;
    fs::write(&file, json).map_err(|e| {
        error!(
            "Failed to write preferences file at {}: {}",
            file.display(),
            e
        );
        AppError::internal()
    })?;
    Ok(())
}

pub fn get_preferences(username: &str) -> AppResult<UserPreferences> {
    let cache = acquire_read_lock(&PREFS_CACHE)?;
    let map = cache.0.as_ref();
    Ok(map
        .and_then(|m| m.get(username).cloned())
        .unwrap_or_default())
}

pub fn set_preferences(username: &str, prefs: UserPreferences) -> AppResult<UserPreferences> {
    let mut cache = acquire_write_lock(&PREFS_CACHE)?;
    let map = cache.0.get_or_insert_with(HashMap::new);
    map.insert(username.to_string(), prefs.clone());
    save_prefs(map)?;
    cache.1 = current_time();
    Ok(prefs)
}
