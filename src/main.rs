use std::collections::HashSet;
use sysinfo::{Process, System};

fn main() {
    let process_names = vec!["Code.exe", "process2", "process3"];  // Replace these names with the names of the processes you want to check
    let mut running_processes = HashSet::new();

    let mut sys = System::new_all();
    sys.refresh_all();

    for (_pid, process) in sys.processes() {
        running_processes.insert(process.name().to_string());
    }

    for process_name in &process_names {
        if running_processes.contains(*process_name) {
            println!("Process '{}' is running.", process_name);
        } else {
            println!("Process '{}' is not running.", process_name);
        }
    }
}