use serde::{Deserialize, Serialize};
use crate::system_info::SystemInfo;
use crate::service::state::AppState;
use crate::service::api_client::ApiClient;
use std::sync::Arc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppStatus {
    pub is_connected: bool,
    pub system_info: SystemInfo,
    pub session_active: bool,
}

#[tauri::command]
pub async fn get_app_status(app_state: tauri::State<'_, Arc<AppState>>) -> Result<AppStatus, String> {
    let system_info = SystemInfo::get();
    let session_active = app_state.is_session_active().await;

    Ok(AppStatus {
        is_connected: session_active,
        system_info,
        session_active,
    })
}

#[tauri::command]
pub async fn check_connection(app_state: tauri::State<'_, Arc<AppState>>) -> Result<bool, String> {
    let is_active = app_state.is_session_active().await;
    tracing::info!("Проверка подключения: {}", if is_active { "✓ Подключено" } else { "✗ Не подключено" });
    Ok(is_active)
}

#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    let info = SystemInfo::get();
    tracing::info!("Системная информация запрошена: {} на {}", info.username, info.os_name);
    info
}

#[tauri::command]
pub async fn exit_app(app_state: tauri::State<'_, Arc<AppState>>) -> Result<(), String> {
    tracing::info!("Завершение приложения инициировано пользователем");

    if let Some(session) = app_state.get_session().await {
        let api_client = ApiClient::new(app_state.backend_url.clone());
        if let Err(e) = api_client.close_session(&session.session_id).await {
            tracing::warn!("Ошибка при закрытии сессии: {}", e);
        }
    }

    app_state.clear_session().await;
    tracing::info!("Сессия закрыта, приложение будет завершено");

    std::process::exit(0);
}

#[tauri::command]
pub async fn reconnect(app_state: tauri::State<'_, Arc<AppState>>) -> Result<bool, String> {
    tracing::info!("Попытка переподключения...");

    let api_client = ApiClient::new(app_state.backend_url.clone());

    match api_client.init_session(app_state.app_hash.clone()).await {
        Ok(session) => {
            app_state.set_session(session).await;
            tracing::info!("✓ Успешно переподключились");
            Ok(true)
        }
        Err(e) => {
            tracing::error!("Ошибка при переподключении: {}", e);
            Err(e)
        }
    }
}

