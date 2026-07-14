use mcsl_resource_provider::{ProviderRequest, fetch_json};

#[tauri::command]
async fn resource_provider(request: ProviderRequest) -> Result<serde_json::Value, String> {
    fetch_json(&request)
        .await
        .map_err(|error| error.code().to_owned())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![resource_provider])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
