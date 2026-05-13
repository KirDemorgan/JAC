use serde::{Deserialize, Serialize};
use sysinfo::System;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub username: String,
    pub os_name: String,
    pub os_version: String,
    pub current_time: String,
    pub hostname: String,
}

impl SystemInfo {
    pub fn get() -> Self {
        let username = whoami::username();
        let hostname = whoami::fallible::hostname().unwrap_or_else(|_| "Unknown".to_string());

        let os_name = System::name().unwrap_or_else(|| "Unknown".to_string());
        let os_version = System::os_version().unwrap_or_else(|| "Unknown".to_string());

        let current_time = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

        SystemInfo {
            username,
            os_name,
            os_version,
            current_time,
            hostname,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_system_info_get() {
        let info = SystemInfo::get();
        assert!(!info.username.is_empty());
        assert!(!info.os_name.is_empty());
        assert!(!info.current_time.is_empty());
    }
}

