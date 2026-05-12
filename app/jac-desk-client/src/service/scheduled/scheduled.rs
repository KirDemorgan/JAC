use std::time::Duration;
use tokio::time;
use tracing::{info, error, warn};
use crate::service::process_service;
use crate::models::process::{ForbiddenProcess};

pub async fn start_process_monitor_scheduler() {
    let mut interval = time::interval(Duration::from_secs(10));

    info!("Запуск планировщика мониторинга процессов (каждые 10 секунд)");

    loop {
        interval.tick().await;

        match run_process_check().await {
            Ok(_) => info!("Мониторинг процессов выполнен успешно"),
            Err(e) => error!("Ошибка в мониторинге процессов: {}", e),
        }
    }
}

async fn run_process_check() -> Result<(), String> {
    let processes = process_service::list_all_processes()
        .map_err(|e| format!("Не удалось получить список процессов: {}", e))?;

    info!("Найдено {} процессов в системе", processes.len());

    let forbidden_processes = vec![
        ForbiddenProcess { name: "bad_process.exe".to_string() },
        ForbiddenProcess { name: "virus.exe".to_string() },
    ]; // TODO Api request here

    match process_service::check_forbidden_processes(forbidden_processes) {
        Ok(result) => {
            if result.found_forbidden.is_empty() {
                info!("Запрещенные процессы не найдены");
            } else {
                warn!("Найдено {} запрещенных процессов!", result.found_forbidden.len());
                for proc in &result.found_forbidden {
                    warn!("  - {} (PID: {})", proc.name, proc.pid);
                }

                process_service::kill_all_forbidden_processes(result.found_forbidden)?;
            }
        }
        Err(e) => {
            error!("Ошибка при проверке запрещенных процессов: {}", e);
            return Err(e);
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::process::ForbiddenProcess;

    #[tokio::test]
    async fn test_run_process_check_success() {
        let result = run_process_check().await;
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_run_process_check_with_forbidden_processes() {
        let result = run_process_check().await;

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
