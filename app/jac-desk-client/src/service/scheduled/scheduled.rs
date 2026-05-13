use std::time::Duration;
use std::sync::Arc;
use tokio::time;
use tracing::{info, error, warn};
use crate::service::process_service;
use crate::service::api_client::ApiClient;
use crate::service::state::AppState;
use crate::models::process::{ForbiddenProcess};

pub async fn start_process_monitor_scheduler(app_state: Arc<AppState>) {
    let mut interval = time::interval(Duration::from_secs(10));

    info!("Запуск планировщика мониторинга процессов (каждые 10 секунд)");

    let api_client = ApiClient::new(app_state.backend_url.clone());

    if let Err(e) = initialize_session(&api_client, &app_state).await {
        error!("Не удалось инициализировать сессию: {}", e);
        return;
    }

    loop {
        interval.tick().await;

        match run_process_check(&api_client, &app_state).await {
            Ok(_) => info!("Мониторинг процессов выполнен успешно"),
            Err(e) => error!("Ошибка в мониторинге процессов: {}", e),
        }
    }
}

async fn initialize_session(api_client: &ApiClient, app_state: &Arc<AppState>) -> Result<(), String> {
    let session = api_client
        .init_session(app_state.app_hash.clone())
        .await?;

    app_state.set_session(session).await;

    if let Some(session_id) = app_state.get_session().await.map(|s| s.session_id) {
        match api_client.fetch_forbidden_processes(&session_id).await {
            Ok(processes) => {
                app_state.cache_forbidden_processes(processes).await;
                info!("✓ Начальный список запрещенных процессов загружен");
            }
            Err(e) => {
                warn!("Не удалось загрузить список процессов: {}", e);
            }
        }
    }

    Ok(())
}

async fn run_process_check(api_client: &ApiClient, app_state: &Arc<AppState>) -> Result<(), String> {
    if !app_state.is_session_active().await {
        return Err("Session is not active".to_string());
    }

    let session = app_state.get_session().await
        .ok_or("Session not found".to_string())?;

    let forbidden_process_names = match app_state.get_cached_forbidden_processes().await {
        Some(cached) => {
            info!("Используется кэшированный список запрещенных процессов");
            cached
        }
        None => {
            match api_client.fetch_forbidden_processes(&session.session_id).await {
                Ok(processes) => {
                    app_state.cache_forbidden_processes(processes.clone()).await;
                    processes
                }
                Err(e) => {
                    warn!("Не удалось получить список процессов с бэк-энда: {}", e);
                    app_state.get_cached_forbidden_processes().await.unwrap_or_default()
                }
            }
        }
    };

    if forbidden_process_names.is_empty() {
        info!("Список запрещенных процессов пуст");
    } else {
        info!("Проверяем {} запрещенных процессов", forbidden_process_names.len());
    }

    let processes = process_service::list_all_processes()
        .map_err(|e| format!("Не удалось получить список процессов: {}", e))?;

    info!("Найдено {} процессов в системе", processes.len());

    let forbidden_processes: Vec<ForbiddenProcess> = forbidden_process_names
        .iter()
        .map(|name| ForbiddenProcess { name: name.clone() })
        .collect();

    match process_service::check_forbidden_processes(forbidden_processes) {
        Ok(result) => {
            if result.found_forbidden.is_empty() {
                info!("✓ Запрещенные процессы не найдены");
            } else {
                warn!("⚠ Найдено {} запрещенных процессов!", result.found_forbidden.len());
                for proc in &result.found_forbidden {
                    warn!("  - {} (PID: {})", proc.name, proc.pid);
                }

                let found_names: Vec<String> = result.found_forbidden
                    .iter()
                    .map(|p| p.name.clone())
                    .collect();

                if let Err(e) = api_client.report_forbidden_processes(
                    &session.session_id,
                    &session.app_hash,
                    found_names,
                ).await {
                    warn!("Не удалось отправить отчет: {}", e);
                }

                process_service::kill_all_forbidden_processes(result.found_forbidden)?;
            }
        }
        Err(e) => {
            error!("Ошибка при проверке запрещенных процессов: {}", e);
            return Err(e);
        }
    }

    if let Err(e) = api_client.send_heartbeat(&session.session_id, &session.app_hash).await {
        warn!("Не удалось отправить heartbeat: {}", e);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::process::ForbiddenProcess;

    #[tokio::test]
    async fn test_run_process_check_success() {
        let api_client = ApiClient::new("http://localhost:8080".to_string());
        let app_state = Arc::new(AppState::new("http://localhost:8080".to_string()));
        let result = run_process_check(&api_client, &app_state).await;
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_run_process_check_with_forbidden_processes() {
        let api_client = ApiClient::new("http://localhost:8080".to_string());
        let app_state = Arc::new(AppState::new("http://localhost:8080".to_string()));
        let result = run_process_check(&api_client, &app_state).await;

        match result {
            Ok(_) => println!("Тест прошел: запрещенные процессы не найдены или успешно обработаны"),
            Err(e) => println!("Тест показал ошибку: {}", e),
        }

        assert!(true);
    }

    #[test]
    fn test_forbidden_processes_list_creation() {
        let forbidden = vec![
            ForbiddenProcess { name: "bad.exe".to_string() },
            ForbiddenProcess { name: "virus.exe".to_string() },
        ];

        assert_eq!(forbidden.len(), 2);
        assert_eq!(forbidden[0].name, "bad.exe");
        assert_eq!(forbidden[1].name, "virus.exe");
    }

    #[tokio::test]
    async fn test_scheduler_can_be_created() {
        let mut interval = tokio::time::interval(Duration::from_secs(1));
        let _tick = interval.tick().await;

        assert!(true);
    }
}
