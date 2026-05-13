use tokio::sync::RwLock;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tracing::{info, warn};
use uuid::Uuid;
use crate::service::api_client::SessionInfo;

const FORBIDDEN_PROCESSES_CACHE_TTL_SECS: u64 = 300; // 5 минут

#[derive(Debug, Clone)]
pub struct CachedForbiddenProcesses {
    pub processes: Vec<String>,
    pub cached_at: u64,
}

impl CachedForbiddenProcesses {
    pub fn is_expired(&self) -> bool {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        now - self.cached_at > FORBIDDEN_PROCESSES_CACHE_TTL_SECS
    }
}

pub struct AppState {
    pub session: Arc<RwLock<Option<SessionInfo>>>,

    pub forbidden_processes_cache: Arc<RwLock<Option<CachedForbiddenProcesses>>>,

    pub app_hash: String,

    pub backend_url: String,
}

impl AppState {
    pub fn new(backend_url: String) -> Self {
        let app_hash = Uuid::new_v4().to_string();

        info!("AppState инициализирован. App Hash: {}", app_hash);

        AppState {
            session: Arc::new(RwLock::new(None)),
            forbidden_processes_cache: Arc::new(RwLock::new(None)),
            app_hash,
            backend_url,
        }
    }

    pub async fn set_session(&self, session: SessionInfo) {
        let mut sess = self.session.write().await;
        *sess = Some(session.clone());
        info!("Сессия установлена: {}", session.session_id);
    }

    pub async fn get_session(&self) -> Option<SessionInfo> {
        self.session.read().await.clone()
    }

    pub async fn is_session_active(&self) -> bool {
        self.session.read().await.is_some()
    }

    pub async fn cache_forbidden_processes(&self, processes: Vec<String>) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let cached = CachedForbiddenProcesses {
            processes: processes.clone(),
            cached_at: now,
        };

        let mut cache = self.forbidden_processes_cache.write().await;
        *cache = Some(cached);

        info!("Кэш запрещенных процессов обновлен: {} процессов", processes.len());
    }

    pub async fn get_cached_forbidden_processes(&self) -> Option<Vec<String>> {
        let cache = self.forbidden_processes_cache.read().await;

        if let Some(cached) = cache.as_ref() {
            return if !cached.is_expired() {
                Some(cached.processes.clone())
            } else {
                warn!("Кэш запрещенных процессов истек");
                None
            }
        }

        None
    }

    pub async fn clear_forbidden_processes_cache(&self) {
        let mut cache = self.forbidden_processes_cache.write().await;
        *cache = None;
        info!("Кэш запрещенных процессов очищен");
    }

    pub async fn clear_session(&self) {
        let mut sess = self.session.write().await;
        *sess = None;
        info!("Сессия очищена");
    }
}

