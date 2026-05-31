package xyz.demorgan.jac.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import xyz.demorgan.jac.model.Client;
import xyz.demorgan.jac.model.ForbiddenProcess;
import xyz.demorgan.jac.model.ProcessEvent;
import xyz.demorgan.jac.model.Alert;
import xyz.demorgan.jac.repository.ClientRepository;
import xyz.demorgan.jac.repository.ForbiddenProcessRepository;
import xyz.demorgan.jac.repository.ProcessEventRepository;
import xyz.demorgan.jac.repository.AlertRepository;
import xyz.demorgan.jac.service.RealtimeService;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
public class ClientV1Controller {

    private final ClientRepository clientRepository;
    private final ForbiddenProcessRepository forbiddenRepository;
    private final ProcessEventRepository processEventRepository;
    private final AlertRepository alertRepository;
    private final RealtimeService realtimeService;

    // Map active session_id -> app_hash (which is also the Client ID / UUID in string format)
    private static final Map<String, String> activeSessions = new ConcurrentHashMap<>();

    public ClientV1Controller(ClientRepository clientRepository,
                              ForbiddenProcessRepository forbiddenRepository,
                              ProcessEventRepository processEventRepository,
                              AlertRepository alertRepository,
                              RealtimeService realtimeService) {
        this.clientRepository = clientRepository;
        this.forbiddenRepository = forbiddenRepository;
        this.processEventRepository = processEventRepository;
        this.alertRepository = alertRepository;
        this.realtimeService = realtimeService;
    }

    // DTO for session init request
    public static class SessionInitRequest {
        public String app_hash;
        public long timestamp;
    }

    // DTO for heartbeat payload
    public static class HeartbeatRequest {
        public String session_id;
        public String app_hash;
        public long timestamp;
        public String status;
    }

    // DTO for forbidden processes report
    public static class ForbiddenProcessesReportRequest {
        public String session_id;
        public String app_hash;
        public long timestamp;
        public List<String> processes;
    }

    // DTO for session close request
    public static class SessionCloseRequest {
        public String session_id;
        public long timestamp;
    }

    @PostMapping("/session/init")
    public ResponseEntity<?> initSession(@RequestBody SessionInitRequest req, HttpServletRequest request) {
        if (req.app_hash == null || req.app_hash.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "app_hash is required"));
        }

        String appHash = req.app_hash.trim();
        UUID clientUuid;
        try {
            clientUuid = UUID.fromString(appHash);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "app_hash must be a valid UUID"));
        }

        // Register client if not already in db
        Optional<Client> existingClient = clientRepository.findById(clientUuid);
        Client client;
        if (existingClient.isEmpty()) {
            String clientIp = request.getRemoteAddr();
            client = Client.builder()
                    .id(clientUuid)
                    .clientId(appHash)
                    .hostname("JAC-Agent-" + appHash.substring(0, 6).toUpperCase())
                    .username("agent")
                    .os("Windows")
                    .osVersion("10.0")
                    .arch("x86_64")
                    .appVersion("1.0.0")
                    .ip(clientIp)
                    .connected(true)
                    .lastSeen(Instant.now())
                    .createdAt(Instant.now())
                    .build();
            clientRepository.save(client);
        } else {
            client = existingClient.get();
            client.setConnected(true);
            client.setLastSeen(Instant.now());
            client.setIp(request.getRemoteAddr());
            clientRepository.save(client);
        }

        // Generate a new session id (UUID)
        String sessionId = UUID.randomUUID().toString();
        activeSessions.put(sessionId, appHash);

        return ResponseEntity.ok(Map.of(
                "session_id", sessionId,
                "app_hash", appHash
        ));
    }

    @GetMapping("/forbidden-processes")
    public ResponseEntity<?> getForbiddenProcesses(@RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
        if (sessionId == null || !activeSessions.containsKey(sessionId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid or missing X-Session-ID"));
        }

        List<ForbiddenProcess> enabledRules = forbiddenRepository.findAll().stream()
                .filter(fp -> Boolean.TRUE.equals(fp.getEnabled()))
                .collect(Collectors.toList());

        List<String> patterns = enabledRules.stream()
                .map(ForbiddenProcess::getPattern)
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "processes", patterns,
                "last_updated", Instant.now().toString()
        ));
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<?> sendHeartbeat(@RequestBody HeartbeatRequest req, HttpServletRequest request) {
        if (req.session_id == null || !activeSessions.containsKey(req.session_id)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid session_id"));
        }

        String appHash = activeSessions.get(req.session_id);
        if (!appHash.equals(req.app_hash)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "session_id does not match app_hash"));
        }

        UUID clientUuid = UUID.fromString(appHash);
        clientRepository.findById(clientUuid).ifPresent(c -> {
            c.setConnected(true);
            c.setLastSeen(Instant.now());
            c.setIp(request.getRemoteAddr());
            clientRepository.save(c);
        });

        // Broadcast active status
        realtimeService.publish(Map.of(
                "type", "heartbeat",
                "clientId", appHash,
                "timestamp", Instant.now().toString()
        ));

        return ResponseEntity.ok().build();
    }

    @PostMapping("/report/forbidden-processes")
    public ResponseEntity<?> reportForbiddenProcesses(@RequestBody ForbiddenProcessesReportRequest req) {
        if (req.session_id == null || !activeSessions.containsKey(req.session_id)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid session_id"));
        }

        String appHash = activeSessions.get(req.session_id);
        if (!appHash.equals(req.app_hash)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "session_id does not match app_hash"));
        }

        UUID clientUuid = UUID.fromString(appHash);

        if (req.processes != null) {
            for (String processName : req.processes) {
                // 1. Create ProcessEvent
                ProcessEvent event = ProcessEvent.builder()
                        .clientId(clientUuid)
                        .eventId("evt-" + UUID.randomUUID().toString())
                        .processName(processName)
                        .pid(0)
                        .status("KILLED")
                        .matchesForbidden(true)
                        .startTime(Instant.now())
                        .endTime(Instant.now())
                        .createdAt(Instant.now())
                        .build();
                ProcessEvent savedEvent = processEventRepository.save(event);

                // 2. Create Alert
                Alert alert = Alert.builder()
                        .clientId(clientUuid)
                        .eventId(savedEvent.getId())
                        .severity("high")
                        .message("Запуск запрещенного процесса: " + processName)
                        .status("open")
                        .createdAt(Instant.now())
                        .build();
                Alert savedAlert = alertRepository.save(alert);

                // 3. Broadcast Alert to Web Dashboard via SSE
                realtimeService.publish(Map.of(
                        "type", "alert",
                        "data", savedAlert,
                        "processName", processName,
                        "clientId", appHash
                ));
            }
        }

        return ResponseEntity.ok().build();
    }

    @PostMapping("/session/close")
    public ResponseEntity<?> closeSession(@RequestBody SessionCloseRequest req) {
        if (req.session_id == null || !activeSessions.containsKey(req.session_id)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid session_id"));
        }

        String appHash = activeSessions.remove(req.session_id);
        if (appHash != null) {
            UUID clientUuid = UUID.fromString(appHash);
            clientRepository.findById(clientUuid).ifPresent(c -> {
                c.setConnected(false);
                c.setLastSeen(Instant.now());
                clientRepository.save(c);
            });

            realtimeService.publish(Map.of(
                    "type", "client_disconnect",
                    "clientId", appHash,
                    "timestamp", Instant.now().toString()
            ));
        }

        return ResponseEntity.ok().build();
    }
}
