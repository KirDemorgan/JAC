mod client;
mod server;

use std::collections::HashSet;
use sysinfo::System;
use std::thread;
use std::time::Duration;
use std::env;
use reqwest;
use serde_json::json;
use eframe::{egui, epi};
use std::sync::{Arc, Mutex};
use tokio::runtime::Runtime;

struct App {
    start_button: Arc<Mutex<bool>>,
}

impl Default for App {
    fn default() -> Self {
        Self {
            start_button: Arc::new(Mutex::new(true)),
        }
    }
}

impl epi::App for App {
    fn update(&mut self, ctx: &egui::CtxRef, _frame: &mut epi::Frame<'_>) {
        egui::CentralPanel::default().show(ctx, |ui| {
            ui.heading("Jokerge Anti Cheat");

            if ui.button("Start").clicked() {
                let output = std::process::Command::new("cmd")
                    .args(&["/C", "start", "steam://run/1172470"])
                    .output()
                    .expect("Failed to execute command");

                if !output.status.success() {
                    eprintln!("Command executed with error: {}", String::from_utf8_lossy(&output.stderr));
                }
                println!("Start button clicked");
            }
        });
    }

    fn name(&self) -> &str {
        "Jokerge Anti Cheat"
    }
}

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
    let app = App::default();
    let start_button = Arc::clone(&app.start_button);
    let bot_token = "6721764725:AAG_NR5XVUuBGFWsX9sO56Jajwc2alv0lPs".to_string();
    let chat_id = "-4153113440".to_string();

    thread::spawn(|| {
        client::main();
    });

    thread::spawn(|| {
        server::main().unwrap();
    });

    thread::spawn(move || {
        let rt = Runtime::new().unwrap();
        loop {
            if *start_button.lock().unwrap() {
                let process_names = vec!["Code.exe", "brave.exe", "chrome.exe"];
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
                        rt.block_on(send_telegram_message(&bot_token, &chat_id, &message)).unwrap();

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
    });

    let native_options = eframe::NativeOptions::default();
    eframe::run_native(Box::new(app), native_options);
}