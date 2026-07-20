//! MCSL Future Web 控制面核心：用户 / 会话 / 节点 / 偏好。
//! Actix HTTP 与 Tauri invoke 共用，不依赖任何 HTTP 框架。

pub mod config;
pub mod error;
pub mod nodes;
pub mod preferences;
pub mod service;
pub mod token;
pub mod user;
pub mod utils;

pub use error::{
    failed, success, AppError, AppResult, FailedEnvelope, InvokeResponse, SuccessEnvelope,
};
pub use service::{dispatch, init_data_dir, ApiRequest, ClientMeta};

pub const MAIN_DIR_NAME: &str = "mcsl-web";
