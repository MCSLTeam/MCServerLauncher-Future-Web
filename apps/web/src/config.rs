use log::{error, info};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use crate::MAIN_DIR_NAME;

#[derive(Serialize, Deserialize, Clone)]
pub struct WebConfig {
    pub host: String,
    pub port: u16,
}

const CONFIG_FILE_NAME: &str = "config.json";

pub fn ensure_config() -> std::io::Result<()> {
    let config_file = Path::new(MAIN_DIR_NAME).join(CONFIG_FILE_NAME);

    if config_file.exists() {
        return Ok(());
    }

    let config = WebConfig {
        host: "0.0.0.0".to_string(),
        port: 11451,
    };

    let config_json = serde_json::to_string_pretty(&config)?;

    fs::write(&config_file, config_json).map_err(|e| {
        error!(
            "Failed to create config file at {}: {}",
            config_file.display(),
            e
        );
        e
    })?;

    info!("Created new config file at {}", config_file.display());

    Ok(())
}

pub fn load_config(main_dir: &Path) -> std::io::Result<WebConfig> {
    let config_file = main_dir.join(CONFIG_FILE_NAME);

    let config_json = fs::read_to_string(&config_file).map_err(|e| {
        error!(
            "Failed to read config file at {}: {}",
            config_file.display(),
            e
        );
        e
    })?;

    let config: WebConfig = serde_json::from_str(&config_json).map_err(|e| {
        error!(
            "Failed to parse config file at {}: {}",
            config_file.display(),
            e
        );
        e
    })?;

    info!("Loaded config file");

    Ok(config)
}
