pub mod models;
pub mod service;
pub mod utils;
pub mod logger;
pub mod system_info;
pub mod tauri_commands;

use std::sync::Arc;
use service::state::AppState;
use service::scheduled::scheduled::start_process_monitor_scheduler;

#[tokio::main]
async fn main() {
    if let Err(e) = logger::init_logger() {
        eprintln!("Ошибка инициализации логирования: {}", e);
    }

    tracing::info!("Запуск JAC Desktop Client");

    let backend_url = std::env::var("BACKEND_URL")
        .unwrap_or_else(|_| "http://localhost:8080".to_string());

    tracing::info!("Backend URL: {}", backend_url);

    let app_state = Arc::new(AppState::new(backend_url));
    let state_clone = Arc::clone(&app_state);

    tokio::spawn(async move {
        start_process_monitor_scheduler(state_clone).await;
    });

    tauri::Builder::default()
        .manage(app_state.clone())
        .invoke_handler(tauri::generate_handler![
            tauri_commands::get_app_status,
            tauri_commands::check_connection,
            tauri_commands::get_system_info,
            tauri_commands::exit_app,
            tauri_commands::reconnect,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
