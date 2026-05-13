pub mod models;
pub mod service;
pub mod ui;
pub mod utils;

use std::sync::Arc;
use tracing_subscriber;
use service::state::AppState;
use service::scheduled::scheduled::start_process_monitor_scheduler;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    tracing::info!("Запуск JAC Desktop Client");

    let backend_url = std::env::var("BACKEND_URL")
        .unwrap_or_else(|_| "http://localhost:8080".to_string());

    tracing::info!("Backend URL: {}", backend_url);

    let app_state = Arc::new(AppState::new(backend_url));

    let state_clone = Arc::clone(&app_state);
    tokio::spawn(async move {
        start_process_monitor_scheduler(state_clone).await;
    });

    // TODO: UI инициализация Tauri

    tokio::signal::ctrl_c()
        .await
        .expect("Failed to listen for ctrl+c");

    tracing::info!("Завершение приложения");

    if let Some(session) = app_state.get_session().await {
        let api_client = service::api_client::ApiClient::new(app_state.backend_url.clone());
        if let Err(e) = api_client.close_session(&session.session_id).await {
            tracing::warn!("Ошибка при закрытии сессии: {}", e);
        }
    }

    app_state.clear_session().await;
    tracing::info!("Приложение закрыто корректно");
}
