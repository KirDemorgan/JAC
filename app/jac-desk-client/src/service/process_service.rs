use sysinfo::{System, Pid};
use tracing::{info, warn, error};
use crate::models::process::{ForbiddenProcess, ForbiddenProcessCheckResult, ProcessInfo};

pub(crate) fn list_all_processes() -> Result<Vec<ProcessInfo>, String> {
    list_all_processes_with_system(&mut System::new_all())
}

fn list_all_processes_with_system(sys: &mut System) -> Result<Vec<ProcessInfo>, String> {
    sys.refresh_all();

    let processes: Vec<ProcessInfo> = sys.processes()
        .iter()
        .map(|(pid, process)| {
            let name = process.name()
                .to_string_lossy()
                .to_string();

            let pid_u32 = pid.as_u32();
            let memory = process.memory();

            info!("Found process: {} (PID: {}, Memory: {} MB)",
                name, pid_u32, memory / 1024 / 1024);

            ProcessInfo {
                name,
                pid: pid_u32,
                memory,
            }
        })
        .collect();

    if processes.is_empty() {
        return Err("No processes found".to_string());
    }

    Ok(processes)
}

pub(crate) fn check_forbidden_processes(forbidden_list: Vec<ForbiddenProcess>) -> Result<ForbiddenProcessCheckResult, String> {
    let mut sys = System::new_all();
    check_forbidden_processes_with_system(&mut sys, forbidden_list)
}

fn check_forbidden_processes_with_system(sys: &mut System, forbidden_list: Vec<ForbiddenProcess>) -> Result<ForbiddenProcessCheckResult, String> {
    let system_processes = list_all_processes_with_system(sys)?;

    let mut found_forbidden = Vec::new();
    let mut not_found = Vec::new();

    for forbidden in forbidden_list {
        let mut found_instances = Vec::new();

        for sys_proc in &system_processes {
            if sys_proc.name.contains(&forbidden.name) {
                found_instances.push(sys_proc.clone());
            }
        }

        if !found_instances.is_empty() {
            warn!("ЗАПРЕЩЕННЫЙ ПРОЦЕСС НАЙДЕН: {} ({} экземпляров)", 
                forbidden.name, found_instances.len());
            found_forbidden.extend(found_instances);
        } else {
            info!("Запрещенный процесс '{}' не найден в системе", forbidden.name);
            not_found.push(forbidden.name);
        }
    }

    Ok(ForbiddenProcessCheckResult {
        found_forbidden,
        not_found,
    })
}

pub(crate) fn kill_forbidden_process(pid: u32) -> Result<(), String> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let target_pid = Pid::from_u32(pid);

    if let Some(process) = sys.process(target_pid) {
        let name = process.name().to_string_lossy().to_string();

        match process.kill() {
            true => {
                info!("Процесс '{}' (PID: {}) успешно завершен", name, pid);
                Ok(())
            }
            false => {
                error!("Не удалось завершить процесс '{}' (PID: {})", name, pid);
                Err(format!("Failed to kill process {} (PID: {})", name, pid))
            }
        }
    } else {
        Err(format!("Process with PID {} not found", pid))
    }
}

pub(crate) fn kill_all_forbidden_processes(forbidden_processes: Vec<ProcessInfo>) -> Result<(), String> {
    let mut success = Vec::new();
    let mut failed = Vec::new();

    for proc in forbidden_processes {
        match kill_forbidden_process(proc.pid) {
            Ok(_) => success.push(format!("{} (PID: {})", proc.name, proc.pid)),
            Err(e) => failed.push(e),
        }
    }

    if failed.is_empty() {
        info!("Успешно завершено {} процессов: {:?}", success.len(), success);
        Ok(())
    } else {
        let error_msg = format!("Не удалось завершить {} процессов: {:?}", failed.len(), failed);
        error!("{}", error_msg);
        Err(error_msg)
    }
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_list_all_processes() {
        match list_all_processes() {
            Ok(processes) => {
                assert!(!processes.is_empty());
                println!("Found {} processes", processes.len());
            }
            Err(e) => panic!("Failed to list processes: {}", e),
        }
    }

    #[test]
    fn test_check_forbidden_processes() {
        let forbidden = vec![
            ForbiddenProcess { name: "nonexistent_process".to_string() },
            ForbiddenProcess { name: "another_fake".to_string() },
        ];

        match check_forbidden_processes(forbidden) {
            Ok(result) => {
                println!("Found forbidden: {}, Not found: {}",
                         result.found_forbidden.len(), result.not_found.len());
                assert_eq!(result.found_forbidden.len(), 0); // Должны быть не найдены
            }
            Err(e) => panic!("Error: {}", e),
        }
    }
}
