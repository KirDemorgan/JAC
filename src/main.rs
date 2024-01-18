use std::collections::HashSet;
use sysinfo::System;
use std::thread;
use std::time::Duration;
use std::env;
use reqwest;
use serde_json::json;

async fn send_telegram_message(bot_token: &str, chat_id: &str, message: &str) -> Result<(), Box<dyn std::error::Error>> {
    let url = format!("https://api.telegram.org/bot{}/sendMessage", bot_token);
    let params = json!({
        "chat_id": chat_id,
        "text": message
    });

    let client = reqwest::Client::new();
    let response = client.post(&url).json(&params).send().await?;

    if response.status().is_success() {
        println!("Message sent successfully");
    } else {
        println!("Failed to send message: {}", response.text().await?);
    }

    Ok(())
}

fn main() {
    let bot_token = env::var("6721764725:AAG_NR5XVUuBGFWsX9sO56Jajwc2alv0lPs").unwrap();
    let chat_id = env::var("-4153113440").unwrap();
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

                let message = format!("Process '{}' is running.", process_name);
                send_telegram_message(&bot_token, &chat_id, &message);

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