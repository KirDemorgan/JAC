use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessInfo {
    pub name: String,
    pub pid: u32,
    pub memory: u64
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForbiddenProcess {
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForbiddenProcessCheckResult {
    pub found_forbidden: Vec<ProcessInfo>,
    pub not_found: Vec<String>,
}