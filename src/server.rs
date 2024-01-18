use std::collections::HashSet;
use std::net::{TcpListener, TcpStream, SocketAddr};
use std::sync::{Arc, Mutex};
use tungstenite::accept_hdr;
use tungstenite::handshake::server::{Request, Response};
use tungstenite::protocol::WebSocketConfig;
use tungstenite::{Message, Result};
use url::Url;

pub fn main() -> std::io::Result<()> {
    let server = TcpListener::bind("127.0.0.1:9001")?;
    let client_count = Arc::new(Mutex::new(0)); // Создаем счетчик клиентов
    let clients = Arc::new(Mutex::new(HashSet::new())); // Создаем набор для хранения идентификаторов клиентов

    for stream in server.incoming() {
        let stream = stream?;
        let client_count = Arc::clone(&client_count); // Клонируем счетчик для использования в потоке
        let clients = Arc::clone(&clients); // Клонируем набор для использования в потоке
        let client_addr = stream.peer_addr()?; // Получаем адрес клиента

        std::thread::spawn(move || -> std::io::Result<()> {
            let mut clients = clients.lock().unwrap();
            if clients.insert(client_addr) { // Если клиент еще не присутствует в наборе
                *client_count.lock().unwrap() += 1; // Увеличиваем счетчик
                println!("New client: {}", client_addr);
                println!("Total clients: {}", *client_count.lock().unwrap()); // Выводим общее количество клиентов
            }

            let callback = |req: &Request, response: Response| {
                println!("Received a new ws handshake");
                println!("The request's path is: {}", req.uri().path());
                println!("The request's headers are: {:?}", req.headers());
                Ok(response)
            };
            let mut websocket = accept_hdr(stream, callback).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;

            println!("New WebSocket connection");

            loop {
                let msg = websocket.read().map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;

                if msg.is_binary() || msg.is_text() {
                    websocket.write_message(msg).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
                }
            }
            Ok(())
        });
    }
    Ok(())
}