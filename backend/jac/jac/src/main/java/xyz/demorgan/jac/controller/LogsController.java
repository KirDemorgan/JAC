package xyz.demorgan.jac.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import xyz.demorgan.jac.model.AuditLog;
import xyz.demorgan.jac.repository.AuditLogRepository;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/clients/{clientId}/logs")
public class LogsController {
    private final AuditLogRepository auditLogRepository;

    public LogsController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @PostMapping
    public ResponseEntity<?> postLogs(@PathVariable String clientId, @RequestBody Map<String, Object> body, Authentication auth) {
        AuditLog l = AuditLog.builder()
                .actor(auth == null ? clientId : auth.getName())
                .action("client_log")
                .target(clientId)
                .details(body == null ? null : body.toString())
                .createdAt(Instant.now())
                .build();
        auditLogRepository.save(l);
        return ResponseEntity.status(201).body(Map.of("logId", l.getId().toString(), "storedAt", l.getCreatedAt().toString()));
    }
}

