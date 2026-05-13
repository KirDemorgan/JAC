let isLoading = false;

document.addEventListener('DOMContentLoaded', () => {
    loadStatus();
    setupEventListeners();
    setInterval(updateTime, 1000);
    setInterval(loadStatus, 3000);
});

function setupEventListeners() {
    document.getElementById('reconnectBtn').addEventListener('click', reconnect);
    document.getElementById('exitBtn').addEventListener('click', exit);
}

async function loadStatus() {
    try {
        const result = await window.__TAURI__.core.invoke('get_app_status');
        updateUI(result);
    } catch (error) {
        console.error('Ошибка загрузки статуса:', error);
        showError('Не удалось загрузить статус: ' + error);
    }
}

function updateUI(data) {
    const { system_info, is_connected } = data;

    document.getElementById('username').textContent = system_info.username;
    document.getElementById('osInfo').textContent =
        `${system_info.os_name} ${system_info.os_version}`;
    document.getElementById('hostname').textContent = system_info.hostname;

    const statusElement = document.getElementById('connectionStatus');
    if (is_connected) {
        statusElement.innerHTML = `
            <div class="indicator connected"></div>
            <span class="indicator-text">Подключено ✓</span>
        `;
    } else {
        statusElement.innerHTML = `
            <div class="indicator disconnected"></div>
            <span class="indicator-text">Отключено</span>
        `;
    }

    hideError();
}

function updateTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent = now.toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

async function reconnect() {
    if (isLoading) return;

    const btn = document.getElementById('reconnectBtn');
    isLoading = true;
    btn.disabled = true;

    const originalText = btn.textContent;
    btn.textContent = '🔄 ' + (new Date()).toLocaleTimeString();

    try {
        const result = await window.__TAURI__.core.invoke('reconnect');
        if (result) {
            await loadStatus();
            showSuccess('Успешно переподключились!');
        } else {
            showError('Не удалось переподключиться');
        }
    } catch (error) {
        console.error('Ошибка переподключения:', error);
        showError('Ошибка переподключения: ' + error);
    } finally {
        isLoading = false;
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

async function exit() {
    if (confirm('Вы уверены? Приложение будет закрыто.')) {
        try {
            await window.__TAURI__.core.invoke('exit_app');
        } catch (error) {
            console.error('Ошибка выхода:', error);
            showError('Ошибка при выходе: ' + error);
        }
    }
}

function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

function showSuccess(message) {
    hideError();
    console.log('✓ ' + message);
}