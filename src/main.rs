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
#[tokio::main]
async fn main() {
    let bot_token = "6721764725:AAG_NR5XVUuBGFWsX9sO56Jajwc2alv0lPs";
    let chat_id = "-4153113440";
    loop {
        let process_names = vec!["Code.exe", "process2", "process3"];
        let mut running_processes = HashSet::new();

        let mut sys = System::new_all();
        sys.refresh_all();

        for (_pid, process) in sys.processes() {
            running_processes.insert(process.name().to_string());
        }
        println!("-----------------------------------");
        for process_name in &process_names {
            if running_processes.contains(*process_name) {
                println!("Process '{}' is running.", process_name);

                let message = format!("Process '{}' is running on '{}'.", process_name, env::var("USERNAME").unwrap());
                let _ = send_telegram_message(&bot_token, &chat_id, &message).await;

                match env::var("USERNAME") {
                    Ok(val) => println!("Windows username: {}", val),
                    Err(_e) => println!("Couldn't read USERNAME environment variable"),
                }
            } else {
                println!("Process '{}' is not running.", process_name);
            }
        }
        println!("-----------------------------------");

        thread::sleep(Duration::from_secs(60));
    }
}