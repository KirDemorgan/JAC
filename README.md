# Jokerge Anti Cheat

Jokerge Anti Cheat (JAC) is a simple application designed to monitor and alert the user if certain processes are running on their system. It's built with Rust and uses the `egui` and `eframe` libraries for the graphical user interface, `sysinfo` for system information, and `reqwest` for HTTP requests.

## Features

- Monitors a list of specified processes.
- Sends a Telegram message if any of the monitored processes are running.
- Provides a simple GUI to start the monitoring process.

## Usage

1. Clone the repository to your local machine.
2. Replace `YOUR BOT TOKEN` and `CHAT_ID` in the `main` function with your Telegram bot token and chat ID.
3. Run the application.

## Dependencies

- Rust
- `egui`
- `eframe`
- `sysinfo`
- `reqwest`
- `tokio`

## Building

To build the application, navigate to the project directory and run:

```sh
cargo build --release
```


## Running

To run the application, execute the following command:

```
cargo run
```
