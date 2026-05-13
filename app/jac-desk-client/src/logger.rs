use std::fs;
use std::path::PathBuf;
use tracing_subscriber::fmt::format::FmtSpan;
use tracing_subscriber::layer::SubscriberExt;

pub fn init_logger() -> anyhow::Result<()> {
    let log_dir = get_log_dir()?;

    fs::create_dir_all(&log_dir)?;

    let log_file_path = log_dir.join(format!("jac-client-{}.log", chrono::Local::now().format("%Y%m%d")));

    let file = fs::File::create(&log_file_path)?;

    let file_layer = tracing_subscriber::fmt::layer()
        .with_writer(std::sync::Arc::new(file))
        .with_span_events(FmtSpan::CLOSE)
        .with_target(true)
        .with_thread_ids(true)
        .with_file(true)
        .with_line_number(true);

    let console_layer = tracing_subscriber::fmt::layer()
        .with_writer(std::io::stdout)
        .with_target(true)
        .pretty();

    let subscriber = tracing_subscriber::registry()
        .with(console_layer)
        .with(file_layer)
        .with(tracing_subscriber::filter::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| tracing_subscriber::filter::EnvFilter::new("info")));

    let _ = tracing::subscriber::set_default(subscriber);

    tracing::info!("Логирование инициализировано. Файл: {}", log_file_path.display());

    Ok(())
}

fn get_log_dir() -> anyhow::Result<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        let log_dir = dirs::data_local_dir()
            .ok_or_else(|| anyhow::anyhow!("Не удалось получить локальную папку данных"))?
            .join("JAC")
            .join("logs");
        Ok(log_dir)
    }
}

