# JAC Agent Backend

Краткое описание
---------------
Сервис для приёма регистраций клиентов-агентов, heartbeat, процесса событий, логов, управления запрещёнными процессами и генерации алертов.

Ключевые возможности
- Регистрация агентов и выдача API-ключа
- Heartbeat (keepalive)
- Приём process-event с идемпотентностью
- Forbidden processes CRUD (админ)
- Alerts (создание при совпадении правил) и realtime push (SSE)
- Логирование входящих логов в audit_logs
- JWT для админ UI (/auth/login)
- Flyway миграции, Prometheus (Actuator)

Содержание репозитория
- `src/main/java/...` — исходники
- `src/main/resources/db/migration` — Flyway миграции (V1__init.sql)
- `src/main/resources/application.yaml` — конфигурация

Запуск
------
Требования: Java 17, Gradle

Настройте переменные окружения перед запуском (пример):

```
export DATABASE_URL=jdbc:postgresql://localhost:5432/jac
export DATABASE_USER=postgres
export DATABASE_PASSWORD=postgres
export JWT_SECRET=supersecret
export ADMIN_USER=admin
export ADMIN_PASSWORD=admin
```

Запуск приложения в dev:

```bash
./gradlew bootRun
```

Миграции Flyway выполняются автоматически при запуске.

API: краткая сводка endpoint'ов
---------------------------------
Все форматы времени — ISO8601 UTC. Идентификаторы — UUIDv4.

1) POST /api/clients/register
   Auth: none или `X-Register-Secret` если настроено
   Request JSON:
   ```json
   { "clientId": "optional", "hostname":"DESKTOP-01", "username":"ivan", "os":"Windows", "appVersion":"1.0.0" }
   ```
   Response 201:
   ```json
   { "clientId": "<uuid>", "apiKey": "<id.secret>", "issuedAt":"..." }
   ```

2) POST /api/clients/{clientId}/heartbeat
   Auth: Bearer API_KEY
   Request JSON:
   ```json
   { "timestamp":"2026-05-18T12:34:56Z", "uptimeSeconds":3600 }
   ```
   Response 200:
   ```json
   { "status":"ok", "serverTime":"..." }
   ```

3) POST /api/clients/{clientId}/process-event
   Auth: Bearer API_KEY
   Request JSON:
   ```json
   { "eventId":"evt-1","processName":"bad.exe","pid":1111,"status":"forbidden_detected","matchesForbiddenRule":true }
   ```
   Response 201:
   ```json
   { "eventId":"<server-uuid>", "action":"logged" }
   ```

4) GET /api/clients (admin)
   Auth: Bearer JWT (ROLE_ADMIN)
   Response: paginated list of clients

5) GET /api/clients/{clientId} (admin)
   Auth: Bearer JWT

6) GET/POST/PUT/DELETE /api/forbidden-processes (admin)
   CRUD для правил

7) GET /api/alerts
   POST /api/alerts/{id}/resolve

8) POST /api/clients/{clientId}/logs
   Accepts JSON log object and stores as audit_log

9) GET /api/clients/{clientId}/config
   Returns current forbidden list and checksum

10) POST /api/clients/{clientId}/rotate-key (admin)

11) /sse — SSE endpoint for realtime events (requires auth)

12) POST /auth/login — get JWT for admin UI (ADMIN_USER/ADMIN_PASSWORD env)

Error format
------------
Унифицированный JSON-ответ об ошибке:

```json
{
  "timestamp": "2026-05-18T12:34:56Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Поле hostname обязательно",
  "path": "/api/clients/register"
}
```

Notes и ограничения текущей реализации
--------------------------------------
- API-ключ формируется в виде `<id>.<secret>`; на сервере хранится только hash секрета (Argon2).
- Временно: админ-пользователь хранится в окружении (ADMIN_USER/ADMIN_PASSWORD). Для продакшна — подключить базу пользователей или внешний IdP.
- Rate-limiting не реализован (планируется Redis-based token bucket).
- Regex rules выполняются прямо через `String.matches` — будьте осторожны с выражениями (в будущем добавить timeout/safe-regex).
- Логи хранятся в таблице `audit_logs` как JSON-представление.
