use reqwest::Client;
use serde::{Deserialize, Serialize};
use tracing::{info, error, warn};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionInfo {
    pub session_id: String,
    pub app_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForbiddenProcessesResponse {
    pub processes: Vec<String>,
    pub last_updated: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeartbeatPayload {
    pub session_id: String,
    pub app_hash: String,
    pub timestamp: i64,
    pub status: String,
}

pub struct ApiClient {
    http_client: Client,
    base_url: String,
}

impl ApiClient {
    pub fn new(base_url: String) -> Self {
        ApiClient {
            http_client: Client::new(),
            base_url,
        }
    }

    pub async fn init_session(&self, app_hash: String) -> Result<SessionInfo, String> {
        let url = format!("{}/api/v1/session/init", self.base_url);

        let payload = serde_json::json!({
            "app_hash": app_hash,
            "timestamp": chrono::Utc::now().timestamp(),
        });

        match self.http_client.post(&url)
            .json(&payload)
            .send()
            .await
        {
            Ok(response) => {
                match response.json::<SessionInfo>().await {
                    Ok(session) => {
                        info!("✓ Сессия инициализирована: {}", session.session_id);
                        Ok(session)
                    }
                    Err(e) => {
                        error!("Ошибка парсинга ответа инициализации: {}", e);
                        Err(format!("Failed to parse session response: {}", e))
                    }
                }
            }
            Err(e) => {
                error!("Ошибка инициализации сессии: {}", e);
                Err(format!("Failed to init session: {}", e))
            }
        }
    }

    pub async fn fetch_forbidden_processes(&self, session_id: &str) -> Result<Vec<String>, String> {
        let url = format!("{}/api/v1/forbidden-processes", self.base_url);

        match self.http_client.get(&url)
            .header("X-Session-ID", session_id)
            .send()
            .await
        {
            Ok(response) => {
                match response.json::<ForbiddenProcessesResponse>().await {
                    Ok(data) => {
                        info!("Получено {} запрещенных процессов", data.processes.len());
                        Ok(data.processes)
                    }
                    Err(e) => {
                        error!("Ошибка парсинга списка процессов: {}", e);
                        Err(format!("Failed to parse forbidden processes: {}", e))
                    }
                }
            }
            Err(e) => {
                error!("Ошибка при получении запрещенных процессов: {}", e);
                Err(format!("Failed to fetch forbidden processes: {}", e))
            }
        }
    }

    pub async fn send_heartbeat(&self, session_id: &str, app_hash: &str) -> Result<(), String> {
        let url = format!("{}/api/v1/heartbeat", self.base_url);

        let payload = HeartbeatPayload {
            session_id: session_id.to_string(),
            app_hash: app_hash.to_string(),
            timestamp: chrono::Utc::now().timestamp(),
            status: "alive".to_string(),
        };

        match self.http_client.post(&url)
            .json(&payload)
            .send()
            .await
        {
            Ok(response) => {
                if response.status().is_success() {
                    info!("Heartbeat отправлен успешно");
                    Ok(())
                } else {
                    warn!("Heartbeat ответил статусом: {}", response.status());
                    Err(format!("Heartbeat failed with status: {}", response.status()))
                }
            }
            Err(e) => {
                error!("Ошибка отправки heartbeat: {}", e);
                Err(format!("Failed to send heartbeat: {}", e))
            }
        }
    }

    pub async fn report_forbidden_processes(
        &self,
        session_id: &str,
        app_hash: &str,
        process_names: Vec<String>,
    ) -> Result<(), String> {
        let url = format!("{}/api/v1/report/forbidden-processes", self.base_url);

        let payload = serde_json::json!({
            "session_id": session_id,
            "app_hash": app_hash,
            "timestamp": chrono::Utc::now().timestamp(),
            "processes": process_names,
        });

        match self.http_client.post(&url)
            .json(&payload)
            .send()
            .await
        {
            Ok(response) => {
                if response.status().is_success() {
                    info!("✓ Отчет о запрещенных процессах отправлен");
                    Ok(())
                } else {
                    warn!("Отчет ответил статусом: {}", response.status());
                    Err(format!("Report failed with status: {}", response.status()))
                }
            }
            Err(e) => {
                error!("Ошибка отправки отчета: {}", e);
                Err(format!("Failed to send report: {}", e))
            }
        }
    }

    pub async fn close_session(&self, session_id: &str) -> Result<(), String> {
        let url = format!("{}/api/v1/session/close", self.base_url);

        let payload = serde_json::json!({
            "session_id": session_id,
            "timestamp": chrono::Utc::now().timestamp(),
        });

        match self.http_client.post(&url)
            .json(&payload)
            .send()
            .await
        {
            Ok(response) => {
                if response.status().is_success() {
                    info!("✓ Сессия закрыта корректно");
                    Ok(())
                } else {
                    Err(format!("Failed to close session: {}", response.status()))
                }
            }
            Err(e) => {
                error!("Ошибка закрытия сессии: {}", e);
                Err(format!("Failed to close session: {}", e))
            }
        }
    }
}

