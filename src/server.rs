use std::net::TcpStream;
use std::net::TcpListener;
use tungstenite::accept_hdr;
use tungstenite::handshake::server::{Request, Response};
use tungstenite::protocol::WebSocketConfig;
use tungstenite::{Message, Result};
use url::Url;

pub fn main() -> std::io::Result<()> {
    let server = TcpListener::bind("127.0.0.1:9001")?;
    for stream in server.incoming() {
        let stream = stream?;
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
    }
    Ok(())
}