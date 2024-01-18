#![allow(deprecated)]

use tungstenite::{connect, Message};
use url::Url;

pub fn main() {
    let (mut socket, response) =
        connect(Url::parse("ws://localhost:9001").unwrap()).expect("Can't connect");

    println!("Connected to the server");
    println!("Response HTTP code: {}", response.status());
    println!("Response contains the following headers:");
    for (header, _ /* value */) in response.headers() {
        println!("* {}", header.as_str());
    }

    socket
        .write_message(Message::Text("Hello WebSocket".into()))
        .unwrap();
    loop {
        let msg = socket.read_message().expect("Error reading message");
        println!("Received: {}", msg);
    }
}