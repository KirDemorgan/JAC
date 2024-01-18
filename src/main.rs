use std::collections::HashSet;
use sysinfo::System;
use std::thread;
use std::time::Duration;
use std::env;

fn main() {
    loop {
        let process_names = vec!["Code.exe", "process2", "process3"];
        let mut running_processes = HashSet::new();

        let mut sys = System::new_all();
        sys.refresh_all();

        for (_pid, process) in sys.processes() {
            running_processes.insert(process.name().to_string());
        }

        for process_name in &process_names {
            if running_processes.contains(*process_name) {
                println!("Process '{}' is running.", process_name);
                match env::var("USERNAME") {
                    Ok(val) => println!("Windows username: {}", val),
                    Err(_e) => println!("Couldn't read USERNAME environment variable"),
                }
            } else {
                println!("Process '{}' is not running.", process_name);
            }
        }

        thread::sleep(Duration::from_secs(60));
    }
}