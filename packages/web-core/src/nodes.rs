use crate::error::{AppError, AppResult};
use crate::user::User;
use crate::utils::{
    acquire_read_lock, acquire_write_lock, current_time, generate_random_string,
};
use crate::MAIN_DIR_NAME;
use log::{error, info};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Error;
use std::path::Path;
use std::sync::{Arc, RwLock};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum NodeVisibilityMode {
    All,
    Selected,
    Admins,
}

impl Default for NodeVisibilityMode {
    fn default() -> Self {
        Self::All
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct StoredNode {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub node_type: String,
    pub host: String,
    pub port: String,
    pub secure: bool,
    pub token: String,
    #[serde(default)]
    pub visibility: NodeVisibilityMode,
    #[serde(default)]
    pub visible_to: Vec<String>,
    pub created_at: u128,
    pub updated_at: u128,
}

#[derive(Serialize, Clone, Debug)]
pub struct NodePublic {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub node_type: String,
    pub host: String,
    pub port: String,
    pub secure: bool,
    pub has_token: bool,
    pub visibility: NodeVisibilityMode,
    pub visible_to: Vec<String>,
    pub created_at: u128,
    pub updated_at: u128,
}

#[derive(Deserialize, Clone)]
pub struct NodeInput {
    pub name: String,
    pub host: String,
    pub port: String,
    pub secure: bool,
    pub token: Option<String>,
    pub visibility: Option<NodeVisibilityMode>,
    pub visible_to: Option<Vec<String>>,
}

#[derive(Deserialize, Clone)]
pub struct VisibilityInput {
    pub visibility: NodeVisibilityMode,
    #[serde(default)]
    pub visible_to: Vec<String>,
}

#[derive(Deserialize, Clone)]
pub struct ImportNodesInput {
    pub nodes: Vec<ImportNodeItem>,
}

#[derive(Deserialize, Clone)]
pub struct ImportNodeItem {
    pub id: Option<String>,
    pub name: String,
    pub host: String,
    pub port: String,
    pub secure: bool,
    pub token: String,
}

const NODES_FILE_NAME: &str = "nodes.json";
pub const PERM_NODE_MANAGE: &str = "mcsl.web.node.manage";

lazy_static::lazy_static! {
    static ref NODES_CACHE: Arc<RwLock<(Option<Vec<StoredNode>>, u128)>> =
        Arc::new(RwLock::new((None, 0)));
}

pub fn load_nodes() -> Result<(), Error> {
    let file = Path::new(MAIN_DIR_NAME).join(NODES_FILE_NAME);
    if !file.exists() {
        let empty: Vec<StoredNode> = Vec::new();
        let json = serde_json::to_string_pretty(&empty)?;
        fs::write(&file, json).map_err(|e| {
            error!("Failed to create nodes file at {}: {}", file.display(), e);
            e
        })?;
        info!("Created new nodes file at {}", file.display());
    }

    let json = fs::read_to_string(&file).map_err(|e| {
        error!("Failed to read nodes file at {}: {}", file.display(), e);
        e
    })?;

    let nodes: Vec<StoredNode> = serde_json::from_str(&json).map_err(|e| {
        error!("Failed to parse nodes file at {}: {}", file.display(), e);
        Error::new(std::io::ErrorKind::InvalidData, e)
    })?;

    let mut cache = NODES_CACHE.write().map_err(|e| {
        error!("Failed to acquire write lock: {}", e);
        Error::new(std::io::ErrorKind::Other, "Failed to acquire lock")
    })?;
    *cache = (Some(nodes), current_time());
    Ok(())
}

fn save_nodes(nodes: &[StoredNode]) -> AppResult<()> {
    let file = Path::new(MAIN_DIR_NAME).join(NODES_FILE_NAME);
    let json = serde_json::to_string_pretty(nodes).map_err(|e| {
        error!("Failed to serialize nodes: {}", e);
        AppError::internal()
    })?;
    fs::write(&file, json).map_err(|e| {
        error!("Failed to write nodes file at {}: {}", file.display(), e);
        AppError::internal()
    })?;
    Ok(())
}

fn with_nodes_mut<F, T>(f: F) -> AppResult<T>
where
    F: FnOnce(&mut Vec<StoredNode>) -> AppResult<T>,
{
    let mut cache = acquire_write_lock(&NODES_CACHE)?;
    let nodes = cache.0.get_or_insert_with(Vec::new);
    let result = f(nodes)?;
    save_nodes(nodes)?;
    cache.1 = current_time();
    Ok(result)
}

fn with_nodes_read<F, T>(f: F) -> AppResult<T>
where
    F: FnOnce(&[StoredNode]) -> AppResult<T>,
{
    let cache = acquire_read_lock(&NODES_CACHE)?;
    let nodes = cache.0.as_ref().map(|v| v.as_slice()).unwrap_or(&[]);
    f(nodes)
}

pub fn user_can_manage_nodes(user: &User) -> bool {
    user.verify_permission(PERM_NODE_MANAGE).unwrap_or(false)
}

pub fn user_can_see_node(user: &User, node: &StoredNode) -> bool {
    if user_can_manage_nodes(user) {
        return true;
    }
    match node.visibility {
        NodeVisibilityMode::All => true,
        NodeVisibilityMode::Admins => false,
        NodeVisibilityMode::Selected => node
            .visible_to
            .iter()
            .any(|name| name.eq_ignore_ascii_case(&user.username)),
    }
}

fn to_public(node: &StoredNode) -> NodePublic {
    NodePublic {
        id: node.id.clone(),
        name: node.name.clone(),
        node_type: node.node_type.clone(),
        host: node.host.clone(),
        port: node.port.clone(),
        secure: node.secure,
        has_token: !node.token.trim().is_empty(),
        visibility: node.visibility.clone(),
        visible_to: node.visible_to.clone(),
        created_at: node.created_at,
        updated_at: node.updated_at,
    }
}

fn validate_input(name: &str, host: &str, port: &str) -> AppResult<()> {
    if name.trim().is_empty() || host.trim().is_empty() || port.trim().is_empty() {
        return Err(AppError::bad_request("invalid-params"));
    }
    if port.parse::<u16>().is_err() {
        return Err(AppError::bad_request("invalid-params"));
    }
    Ok(())
}

pub fn list_visible_nodes(user: &User) -> AppResult<Vec<NodePublic>> {
    with_nodes_read(|nodes| {
        let mut out: Vec<NodePublic> = nodes
            .iter()
            .filter(|n| user_can_see_node(user, n))
            .map(to_public)
            .collect();
        out.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        Ok(out)
    })
}

pub fn get_node_token_for_user(user: &User, id: &str) -> AppResult<String> {
    with_nodes_read(|nodes| {
        let node = nodes
            .iter()
            .find(|n| n.id == id)
            .ok_or_else(|| AppError::not_found("not-found"))?;
        if !user_can_see_node(user, node) {
            return Err(AppError::forbidden("permission-denied"));
        }
        if node.token.trim().is_empty() {
            return Err(AppError::not_found("not-found"));
        }
        Ok(node.token.clone())
    })
}

pub fn create_node(user: &User, input: NodeInput) -> AppResult<NodePublic> {
    if !user_can_manage_nodes(user) {
        return Err(AppError::forbidden("permission-denied"));
    }
    validate_input(&input.name, &input.host, &input.port)?;
    let token = input.token.unwrap_or_default().trim().to_string();
    if token.is_empty() {
        return Err(AppError::bad_request("invalid-params"));
    }
    let now = current_time();
    let node = StoredNode {
        id: generate_random_string(16),
        name: input.name.trim().to_string(),
        node_type: "mcsl-daemon".to_string(),
        host: input.host.trim().to_string(),
        port: input.port.trim().to_string(),
        secure: input.secure,
        token,
        visibility: input.visibility.unwrap_or_default(),
        visible_to: input.visible_to.unwrap_or_default(),
        created_at: now,
        updated_at: now,
    };
    with_nodes_mut(|nodes| {
        let public = to_public(&node);
        nodes.push(node);
        Ok(public)
    })
}

pub fn update_node(user: &User, id: &str, input: NodeInput) -> AppResult<NodePublic> {
    if !user_can_manage_nodes(user) {
        return Err(AppError::forbidden("permission-denied"));
    }
    validate_input(&input.name, &input.host, &input.port)?;
    with_nodes_mut(|nodes| {
        let node = nodes
            .iter_mut()
            .find(|n| n.id == id)
            .ok_or_else(|| AppError::not_found("not-found"))?;
        node.name = input.name.trim().to_string();
        node.host = input.host.trim().to_string();
        node.port = input.port.trim().to_string();
        node.secure = input.secure;
        if let Some(token) = input.token {
            let token = token.trim();
            if !token.is_empty() {
                node.token = token.to_string();
            }
        }
        if let Some(visibility) = input.visibility {
            node.visibility = visibility;
        }
        if let Some(visible_to) = input.visible_to {
            node.visible_to = visible_to;
        }
        node.updated_at = current_time();
        Ok(to_public(node))
    })
}

pub fn set_visibility(user: &User, id: &str, input: VisibilityInput) -> AppResult<NodePublic> {
    if !user_can_manage_nodes(user) {
        return Err(AppError::forbidden("permission-denied"));
    }
    with_nodes_mut(|nodes| {
        let node = nodes
            .iter_mut()
            .find(|n| n.id == id)
            .ok_or_else(|| AppError::not_found("not-found"))?;
        node.visibility = input.visibility;
        node.visible_to = input.visible_to;
        node.updated_at = current_time();
        Ok(to_public(node))
    })
}

pub fn delete_node(user: &User, id: &str) -> AppResult<()> {
    if !user_can_manage_nodes(user) {
        return Err(AppError::forbidden("permission-denied"));
    }
    with_nodes_mut(|nodes| {
        let before = nodes.len();
        nodes.retain(|n| n.id != id);
        if nodes.len() == before {
            return Err(AppError::not_found("not-found"));
        }
        Ok(())
    })
}

pub fn import_nodes(user: &User, input: ImportNodesInput) -> AppResult<Vec<NodePublic>> {
    if !user_can_manage_nodes(user) {
        return Err(AppError::forbidden("permission-denied"));
    }
    with_nodes_mut(|nodes| {
        let mut imported = Vec::new();
        let now = current_time();
        for item in input.nodes {
            if item.name.trim().is_empty()
                || item.host.trim().is_empty()
                || item.port.trim().is_empty()
                || item.token.trim().is_empty()
            {
                continue;
            }
            let id = item
                .id
                .filter(|s| !s.trim().is_empty())
                .unwrap_or_else(|| generate_random_string(16));
            if nodes.iter().any(|n| n.id == id) {
                continue;
            }
            let node = StoredNode {
                id,
                name: item.name.trim().to_string(),
                node_type: "mcsl-daemon".to_string(),
                host: item.host.trim().to_string(),
                port: item.port.trim().to_string(),
                secure: item.secure,
                token: item.token.trim().to_string(),
                visibility: NodeVisibilityMode::All,
                visible_to: Vec::new(),
                created_at: now,
                updated_at: now,
            };
            imported.push(to_public(&node));
            nodes.push(node);
        }
        Ok(imported)
    })
}
