//! 统一 API 分发：Actix 与 Tauri 共用同一套路径语义。

use crate::error::{AppError, AppResult};
use crate::nodes::{self, ImportNodesInput, NodeInput, NodePublic, VisibilityInput};
use crate::preferences::{self, UserPreferences};
use crate::token::{self, SessionInfo};
use crate::user::{self, User, UserInput, UserOutput};
use crate::{config, MAIN_DIR_NAME};
use serde::Deserialize;
use serde_json::{json, Value};
use std::fs;
use std::path::Path;
use std::sync::OnceLock;

static INITED: OnceLock<()> = OnceLock::new();

/// 请求侧元数据（IP / UA / Bearer token）。
#[derive(Clone, Debug, Default)]
pub struct ClientMeta {
    pub ip: String,
    pub user_agent: String,
    pub authorization: Option<String>,
}

impl ClientMeta {
    pub fn desktop() -> Self {
        Self {
            ip: "127.0.0.1".to_string(),
            user_agent: "mcsl-desktop".to_string(),
            authorization: None,
        }
    }

    pub fn with_token(mut self, token: Option<String>) -> Self {
        self.authorization = token;
        self
    }
}

/// 与前端 `requestApi` 对齐的调用描述。
#[derive(Clone, Debug)]
pub struct ApiRequest {
    pub method: String,
    pub path: String,
    pub body: Option<Value>,
    pub meta: ClientMeta,
}

/// 初始化数据目录与缓存。可重复调用，仅首次生效。
pub fn init_data_dir() -> std::io::Result<()> {
    if INITED.get().is_some() {
        return Ok(());
    }

    let main_dir = Path::new(MAIN_DIR_NAME);
    if !main_dir.exists() {
        fs::create_dir_all(main_dir)?;
    }

    config::ensure_config()?;
    user::load_users()?;
    token::load_tokens()?;
    nodes::load_nodes()?;
    preferences::load_preferences()?;

    let _ = INITED.set(());
    Ok(())
}

fn bearer_token(meta: &ClientMeta) -> Option<&str> {
    meta.authorization.as_deref().and_then(|value| {
        let value = value.trim();
        value
            .strip_prefix("Bearer ")
            .or_else(|| value.strip_prefix("bearer "))
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .or_else(|| {
                if value.is_empty() || value.contains(' ') {
                    None
                } else {
                    Some(value)
                }
            })
    })
}

fn optional_user(meta: &ClientMeta) -> Option<User> {
    let token = bearer_token(meta)?;
    match token::get_user_by_token(token) {
        Ok(user) => {
            token::update_token_activity(token, &meta.user_agent, &meta.ip);
            Some(user)
        }
        Err(_) => None,
    }
}

fn require_user(meta: &ClientMeta) -> AppResult<User> {
    optional_user(meta).ok_or_else(|| AppError::unauthorized("invalid-token"))
}

fn require_permission(meta: &ClientMeta, permission: &str) -> AppResult<User> {
    let user = require_user(meta)?;
    if !user.verify_permission(permission).unwrap_or(false) {
        return Err(AppError::forbidden("permission-denied"));
    }
    Ok(user)
}

fn normalize_path(path: &str) -> String {
    let mut p = path.trim().to_string();
    if let Some(stripped) = p.strip_prefix("/api") {
        p = stripped.to_string();
    }
    if !p.starts_with('/') {
        p = format!("/{p}");
    }
    // drop trailing slash except root
    if p.len() > 1 && p.ends_with('/') {
        p.pop();
    }
    p
}

fn parse_body<T: for<'de> Deserialize<'de>>(body: Option<&Value>) -> AppResult<T> {
    let value = body.cloned().unwrap_or(Value::Null);
    serde_json::from_value(value).map_err(|_| AppError::bad_request("invalid-params"))
}

/// 同步分发业务 API。资源下载等二进制接口不在此处理。
pub fn dispatch(req: ApiRequest) -> AppResult<Value> {
    let _ = init_data_dir();

    let method = req.method.to_uppercase();
    let path = normalize_path(&req.path);
    let body = req.body.as_ref();
    let meta = &req.meta;

    match (method.as_str(), path.as_str()) {
        ("GET", "/") => Ok(json!("Hello from MCSL Future Web API!")),

        ("POST", "/account/login") => {
            #[derive(Deserialize)]
            struct LoginRequest {
                username: String,
                password: String,
                remember: bool,
            }
            let data: LoginRequest = parse_body(body)?;
            let user = user::verify_password(&data.username, &data.password)?;
            let token = token::create_session(
                &user.username,
                data.remember,
                meta.ip.clone(),
                meta.user_agent.clone(),
            )?;
            Ok(json!(token))
        }

        ("POST", "/account/desktop-session") => {
            // Tauri 进程内调用视为本机；HTTP 层应在外部先校验 loopback。
            if !is_loopback_ip(&meta.ip) {
                return Err(AppError::forbidden("permission-denied"));
            }
            let username = user::ensure_desktop_admin_username()?;
            let token = token::create_session(
                &username,
                true,
                meta.ip.clone(),
                if meta.user_agent.trim().is_empty() {
                    "mcsl-desktop".to_string()
                } else {
                    meta.user_agent.clone()
                },
            )?;
            Ok(json!(token))
        }

        ("GET", "/account/should-register") => Ok(json!(user::is_user_empty()?)),

        ("POST", "/account/register") => {
            #[derive(Deserialize)]
            struct RegisterRequest {
                username: String,
                password: String,
            }
            let data: RegisterRequest = parse_body(body)?;
            if !user::is_user_empty()? {
                return Err(AppError::forbidden("admin-exists"));
            }
            user::add_user(UserInput {
                username: data.username,
                password: data.password,
                permissions: vec!["*".to_string()],
            })?;
            Ok(json!(null))
        }

        ("GET", "/account/logout") => {
            let token = bearer_token(meta).ok_or_else(|| AppError::forbidden("invalid-token"))?;
            token::delete_token(token)?;
            Ok(json!(null))
        }

        ("POST", "/user/create") => {
            let _ = require_permission(meta, "mcsl.web.user.create")?;
            let data: UserInput = parse_body(body)?;
            user::add_user(data)?;
            Ok(json!(null))
        }

        ("PUT", path) if path.starts_with("/user/info/") && path != "/user/info/self" && path != "/user/info/all" => {
            let username = path.trim_start_matches("/user/info/");
            let _ = require_permission(meta, &format!("mcsl.web.user.{username}.info.change"))?;
            let data: UserInput = parse_body(body)?;
            user::update_user(username, data)?;
            Ok(json!(null))
        }

        ("DELETE", path) if path.starts_with("/user/") && path != "/user/password" => {
            let username = path.trim_start_matches("/user/");
            let _ = require_permission(meta, &format!("mcsl.web.user.{username}.delete"))?;
            user::delete_user(username)?;
            Ok(json!(null))
        }

        ("PUT", "/user/password") => {
            #[derive(Deserialize)]
            struct ChangePasswordRequest {
                old_password: String,
                password: String,
            }
            let current = require_user(meta)?;
            let data: ChangePasswordRequest = parse_body(body)?;
            current.verify_password(&data.old_password)?;
            user::update_user(
                &current.username,
                UserInput {
                    username: current.username.clone(),
                    password: data.password,
                    permissions: current.info.permissions.clone(),
                },
            )?;
            Ok(json!(null))
        }

        ("GET", "/user/info/self") => {
            let user = require_user(meta)?;
            Ok(serde_json::to_value(user.to_output()).unwrap_or(Value::Null))
        }

        ("GET", "/user/info/all") => {
            let current_user = require_user(meta)?;
            let users = user::get_users()?;
            let filtered: Vec<UserOutput> = users
                .into_iter()
                .filter(|u| {
                    if u.username == current_user.username {
                        return true;
                    }
                    let read = format!("mcsl.web.user.{}.info.read", u.username);
                    let change = format!("mcsl.web.user.{}.info.change", u.username);
                    let delete = format!("mcsl.web.user.{}.info.delete", u.username);
                    current_user.verify_permission(&read).unwrap_or(false)
                        || current_user.verify_permission(&change).unwrap_or(false)
                        || current_user.verify_permission(&delete).unwrap_or(false)
                })
                .map(|u| u.to_output())
                .collect();
            Ok(serde_json::to_value(filtered).unwrap_or(Value::Null))
        }

        ("GET", "/session/self") => {
            let user = require_user(meta)?;
            let tokens = token::get_tokens_by_user(&user)?;
            Ok(serde_json::to_value(tokens).unwrap_or(Value::Null))
        }

        ("GET", "/session/all") => {
            let current_user = require_user(meta)?;
            let session_infos = token::get_session_infos()?;
            let filtered: Vec<SessionInfo> = session_infos
                .into_iter()
                .filter(|session| {
                    if session.user == current_user.username {
                        return true;
                    }
                    let read = format!("mcsl.web.user.{}.session.read", session.user);
                    let delete = format!("mcsl.web.user.{}.session.delete", session.user);
                    current_user.verify_permission(&read).unwrap_or(false)
                        || current_user.verify_permission(&delete).unwrap_or(false)
                })
                .collect();
            Ok(serde_json::to_value(filtered).unwrap_or(Value::Null))
        }

        ("DELETE", "/session/self") => {
            let user = require_user(meta)?;
            token::delete_token_by_username(&user.username)?;
            Ok(json!(null))
        }

        ("DELETE", path) if path.starts_with("/session/") => {
            let id_or_user = path.trim_start_matches("/session/");
            // Prefer token_id delete when session exists; otherwise treat as username admin delete.
            if let Ok(session_info) = token::get_session_info_by_id(id_or_user) {
                let user = require_user(meta)?;
                if session_info.user != user.username
                    && !user
                        .verify_permission(&format!(
                            "mcsl.web.user.{}.session.delete",
                            user.username
                        ))
                        .unwrap_or(false)
                {
                    return Err(AppError::forbidden("permission-denied"));
                }
                token::delete_token_by_id(id_or_user)?;
                return Ok(json!(null));
            }
            let _ =
                require_permission(meta, &format!("mcsl.web.user.{id_or_user}.session.delete"))?;
            token::delete_token_by_username(id_or_user)?;
            Ok(json!(null))
        }

        ("GET", "/nodes") => {
            let user = require_user(meta)?;
            let nodes = nodes::list_visible_nodes(&user)?;
            Ok(serde_json::to_value(nodes).unwrap_or(Value::Null))
        }

        ("GET", path) if path.starts_with("/nodes/") && path.ends_with("/token") => {
            let id = path
                .trim_start_matches("/nodes/")
                .trim_end_matches("/token")
                .trim_end_matches('/');
            let user = require_user(meta)?;
            let token = nodes::get_node_token_for_user(&user, id)?;
            Ok(json!({ "token": token }))
        }

        ("POST", "/nodes") => {
            let user = require_user(meta)?;
            let input: NodeInput = parse_body(body)?;
            let node = nodes::create_node(&user, input)?;
            Ok(serde_json::to_value(node).unwrap_or(Value::Null))
        }

        ("POST", "/nodes/import") => {
            let user = require_user(meta)?;
            let input: ImportNodesInput = parse_body(body)?;
            let nodes = nodes::import_nodes(&user, input)?;
            Ok(serde_json::to_value(nodes).unwrap_or(Value::Null))
        }

        ("PUT", path) if path.starts_with("/nodes/") && path.ends_with("/visibility") => {
            let id = path
                .trim_start_matches("/nodes/")
                .trim_end_matches("/visibility")
                .trim_end_matches('/');
            let user = require_user(meta)?;
            let input: VisibilityInput = parse_body(body)?;
            let node = nodes::set_visibility(&user, id, input)?;
            Ok(serde_json::to_value(node).unwrap_or(Value::Null))
        }

        ("PUT", path) if path.starts_with("/nodes/") => {
            let id = path.trim_start_matches("/nodes/");
            let user = require_user(meta)?;
            let input: NodeInput = parse_body(body)?;
            let node = nodes::update_node(&user, id, input)?;
            Ok(serde_json::to_value(node).unwrap_or(Value::Null))
        }

        ("DELETE", path) if path.starts_with("/nodes/") => {
            let id = path.trim_start_matches("/nodes/");
            let user = require_user(meta)?;
            nodes::delete_node(&user, id)?;
            Ok(json!(null))
        }

        ("GET", "/preferences") => {
            let user = require_user(meta)?;
            let prefs = preferences::get_preferences(&user.username)?;
            Ok(serde_json::to_value(prefs).unwrap_or(Value::Null))
        }

        ("PUT", "/preferences") => {
            let user = require_user(meta)?;
            let prefs: UserPreferences = parse_body(body)?;
            let prefs = preferences::set_preferences(&user.username, prefs)?;
            Ok(serde_json::to_value(prefs).unwrap_or(Value::Null))
        }

        _ => Err(AppError::not_found("not-found")),
    }
}

pub fn is_loopback_ip(ip: &str) -> bool {
    ip == "127.0.0.1"
        || ip == "::1"
        || ip == "localhost"
        || ip == "unknown"
        || ip.starts_with("127.")
        || ip.starts_with(":ffff:127.")
}

/// 便捷：桌面端创建本地会话 token。
pub fn create_desktop_session() -> AppResult<String> {
    let value = dispatch(ApiRequest {
        method: "POST".into(),
        path: "/account/desktop-session".into(),
        body: None,
        meta: ClientMeta::desktop(),
    })?;
    value
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(AppError::internal)
}

/// 节点公开类型 re-export 方便调用方。
pub type PublicNode = NodePublic;
