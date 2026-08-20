use mcsl_web_core::error::InvokeResponse;
use mcsl_web_core::service::{ApiRequest, ClientMeta};
use mcsl_web_core::{dispatch, init_data_dir};
use mcsl_resource_provider::{
    DownloadRequest, ProviderRequest, download_to_path, fetch_download_bytes, fetch_json,
    validate_download_url,
};
use serde::Serialize;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_autostart::ManagerExt;

const UPDATE_RELEASE_API: &str =
    "https://api.github.com/repos/MCSLTeam/MCServerLauncher-Future/releases/latest";

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct WebApiArgs {
    method: String,
    path: String,
    body: Option<serde_json::Value>,
    authorization: Option<String>,
}

/// 进程内控制面 API：与 Actix `/api/*` 共用 `mcsl_web_core::dispatch`，不启 HTTP。
#[tauri::command]
fn web_api(args: WebApiArgs) -> InvokeResponse<serde_json::Value> {
    if let Err(e) = init_data_dir() {
        log::error!("init_data_dir failed: {e}");
        return InvokeResponse::err(mcsl_web_core::AppError::internal());
    }
    let mut meta = ClientMeta::desktop();
    meta.authorization = args.authorization;
    match dispatch(ApiRequest {
        method: args.method,
        path: args.path,
        body: args.body,
        meta,
    }) {
        Ok(data) => InvokeResponse::ok(data),
        Err(err) => InvokeResponse::err(err),
    }
}



#[tauri::command]
async fn resource_provider(request: ProviderRequest) -> Result<serde_json::Value, String> {
    fetch_json(&request)
        .await
        .map_err(|error| error.code().to_owned())
}

/// 对齐 WPF More_AutoCheckUpdateForLauncher / CheckUpdate：查 GitHub 最新发布。
/// 无发布或请求失败时返回 None（前端不视为错误）。
#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
struct CheckUpdateResult {
    latest_version: String,
    release_url: String,
}

#[tauri::command]
async fn check_update() -> Result<Option<CheckUpdateResult>, String> {
    let client = reqwest::Client::builder()
        .user_agent("MCServerLauncher-Future-Tauri/0.1")
        .build()
        .map_err(|e| e.to_string())?;
    let response = client
        .get(UPDATE_RELEASE_API)
        .header("Accept", "application/vnd.github+json")
        .send()
        .await
        .map_err(|_| "update-check-failed".to_string())?;
    if !response.status().is_success() {
        return Ok(None);
    }
    let body: serde_json::Value = serde_json::from_slice(
        &response.bytes().await.map_err(|_| "update-check-invalid".to_string())?,
    )
    .map_err(|_| "update-check-invalid".to_string())?;
    let latest_version = body
        .get("tag_name")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let release_url = body
        .get("html_url")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    if latest_version.is_empty() && release_url.is_empty() {
        return Ok(None);
    }
    Ok(Some(CheckUpdateResult {
        latest_version,
        release_url,
    }))
}

/// 用系统默认浏览器打开 URL（检查更新后的下载页）。仅允许 http/https。
#[tauri::command]
fn open_external(url: String) -> Result<(), String> {
    let trimmed = url.trim();
    if !(trimmed.starts_with("https://") || trimmed.starts_with("http://")) {
        return Err("invalid-external-url".to_string());
    }
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("cmd")
            .args(["/C", "start", "", trimmed])
            .spawn();
    }
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open").arg(trimmed).spawn();
    }
    #[cfg(target_os = "linux")]
    {
        let _ = std::process::Command::new("xdg-open").arg(trimmed).spawn();
    }
    Ok(())
}

/// 对齐 WPF More_FollowStartupForLauncher：开机自启当前状态。
#[tauri::command]
fn autostart_enabled(app: AppHandle) -> Result<bool, String> {
    app.autolaunch().is_enabled().map_err(|e| e.to_string())
}

/// 对齐 WPF More_FollowStartupForLauncher：开关开机自启。
#[tauri::command]
fn set_autostart(app: AppHandle, enabled: bool) -> Result<bool, String> {
    let manager = app.autolaunch();
    if enabled {
        manager.enable().map_err(|e| e.to_string())?;
    } else {
        manager.disable().map_err(|e| e.to_string())?;
    }
    manager.is_enabled().map_err(|e| e.to_string())
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ResourceDownloadResult {
    path: String,
    size: u64,
    file_name: String,
}

fn sanitize_file_name(name: &str) -> String {
    let cleaned: String = name
        .chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
            c if c.is_control() => '_',
            c => c,
        })
        .collect();
    let trimmed = cleaned.trim().trim_start_matches('.');
    if trimmed.is_empty() {
        "download.bin".to_owned()
    } else {
        trimmed.to_owned()
    }
}

/// 对齐 WPF SaveFileDialog：让用户选择保存路径（可改文件名）。
#[tauri::command]
async fn pick_save_path(
    default_file_name: String,
    title: Option<String>,
) -> Result<Option<String>, String> {
    let name = sanitize_file_name(&default_file_name);
    let dialog_title = title
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "Save download".to_string());
    let picked = tauri::async_runtime::spawn_blocking(move || {
        rfd::FileDialog::new()
            .set_file_name(&name)
            .set_title(&dialog_title)
            .save_file()
    })
    .await
    .map_err(|e| e.to_string())?;

    Ok(picked.map(|p: PathBuf| p.to_string_lossy().into_owned()))
}

/// 原生 HTTP 下载到用户选定的绝对路径。
#[tauri::command]
async fn resource_download(
    url: String,
    dest_path: String,
) -> Result<ResourceDownloadResult, String> {
    validate_download_url(&url).map_err(|e| e.code().to_owned())?;
    let dest = PathBuf::from(dest_path.trim());
    if dest.as_os_str().is_empty() {
        return Err("invalid-download-path".to_owned());
    }
    if let Some(parent) = dest.parent() {
        if !parent.as_os_str().is_empty() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }

    let size = download_to_path(&url, &dest)
        .await
        .map_err(|e| e.code().to_owned())?;
    let file_name = dest
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("download.bin")
        .to_owned();

    Ok(ResourceDownloadResult {
        path: dest.to_string_lossy().into_owned(),
        size,
        file_name,
    })
}

#[tauri::command]
async fn resource_download_bytes(request: DownloadRequest) -> Result<Vec<u8>, String> {
    let (bytes, _) = fetch_download_bytes(&request.url)
        .await
        .map_err(|e| e.code().to_owned())?;
    Ok(bytes)
}

fn console_window_label(instance_id: &str) -> String {
    let mut label = String::from("console-");
    for ch in instance_id.chars() {
        if ch.is_ascii_alphanumeric() {
            label.push(ch);
        } else {
            label.push('-');
        }
    }
    if label.len() > 96 {
        label.truncate(96);
    }
    label
}

fn urlencoding_encode(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for b in value.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(b as char);
            }
            _ => out.push_str(&format!("%{b:02X}")),
        }
    }
    out
}

/// 对齐 WPF 实例控制台独立子窗口：已开则聚焦，否则新建。
#[tauri::command]
async fn open_instance_console(
    app: AppHandle,
    instance_id: String,
    node_id: String,
    title: Option<String>,
) -> Result<(), String> {
    let instance_id = instance_id.trim();
    let node_id = node_id.trim();
    if instance_id.is_empty() || node_id.is_empty() {
        return Err("invalid-instance-or-node".to_owned());
    }

    let label = console_window_label(instance_id);
    let window_title = title
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| s.to_owned())
        // 对齐 WPF：控制台 - 实例 [id] - 节点 [node]（前端通常已传完整标题）
        .unwrap_or_else(|| format!("控制台 - 实例 [{instance_id}] - 节点 [{node_id}]"));

    if let Some(existing) = app.get_webview_window(&label) {
        let _ = existing.set_title(&window_title);
        let _ = existing.unminimize();
        existing.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    let path = format!(
        "/instances/detail/?id={}&node={}&view=window",
        urlencoding_encode(instance_id),
        urlencoding_encode(node_id)
    );

    WebviewWindowBuilder::new(&app, &label, WebviewUrl::App(path.into()))
        .title(window_title)
        .inner_size(1180.0, 760.0)
        .min_inner_size(640.0, 480.0)
        .resizable(true)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}

fn file_editor_window_label(instance_id: &str, file_path: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    instance_id.hash(&mut hasher);
    file_path.hash(&mut hasher);
    let hash = hasher.finish();
    format!("file-editor-{hash:x}")
}

/// 对齐 WPF FileEditorWindow：独立子窗口打开文件编辑器（Monaco）。
#[tauri::command]
async fn open_file_editor(
    app: AppHandle,
    instance_id: String,
    node_id: String,
    file_path: String,
    file_name: String,
    file_size: Option<u64>,
    title: Option<String>,
) -> Result<(), String> {
    let instance_id = instance_id.trim();
    let node_id = node_id.trim();
    let file_path = file_path.trim();
    let file_name = file_name.trim();
    if instance_id.is_empty() || node_id.is_empty() || file_path.is_empty() {
        return Err("invalid-file-editor-args".to_owned());
    }

    let label = file_editor_window_label(instance_id, file_path);
    if let Some(existing) = app.get_webview_window(&label) {
        let _ = existing.unminimize();
        existing.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    let mut path = format!(
        "/instances/file-editor/?id={}&node={}&path={}&name={}&view=window",
        urlencoding_encode(instance_id),
        urlencoding_encode(node_id),
        urlencoding_encode(file_path),
        urlencoding_encode(if file_name.is_empty() {
            file_path
                .rsplit('/')
                .next()
                .unwrap_or("file")
        } else {
            file_name
        })
    );
    if let Some(size) = file_size {
        path.push_str(&format!("&size={size}"));
    }

    let window_title = title
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| s.to_owned())
        .unwrap_or_else(|| {
            if file_name.is_empty() {
                format!("文件编辑 · {file_path}")
            } else {
                format!("文件编辑 · {file_name}")
            }
        });

    WebviewWindowBuilder::new(&app, &label, WebviewUrl::App(path.into()))
        .title(window_title)
        .inner_size(1100.0, 760.0)
        .min_inner_size(640.0, 480.0)
        .resizable(true)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|_app| {
            if let Err(e) = init_data_dir() {
                eprintln!("init_data_dir failed: {e}");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            web_api,
            resource_provider,
            pick_save_path,
            resource_download,
            resource_download_bytes,
            open_instance_console,
            open_file_editor,
            check_update,
            autostart_enabled,
            set_autostart,
            open_external
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
