package xyz.demorgan.jac.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import xyz.demorgan.jac.model.Alert;
import xyz.demorgan.jac.repository.AlertRepository;

import java.time.Instant;
import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
public class AlertsController {
    private final AlertRepository alertRepository;

    public AlertsController(AlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<?> list(@RequestParam(defaultValue = "all") String status,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "20") int size) {
        PageRequest pr = PageRequest.of(page, size);
        Page<Alert> p;
        if ("all".equalsIgnoreCase(status)) p = alertRepository.findAll(pr);
        else p = alertRepository.findByStatus(status, pr);
        return ResponseEntity.ok(Map.of("page", p.getNumber(), "size", p.getSize(), "total", p.getTotalElements(), "alerts", p.getContent()));
    }

    @PostMapping("/{id}/resolve")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<?> resolve(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return alertRepository.findById(id).map(a -> {
            a.setStatus("closed");
            a.setResolvedAt(Instant.now());
            alertRepository.save(a);
            return ResponseEntity.ok(Map.of("alertId", a.getId().toString(), "status", a.getStatus(), "resolvedAt", a.getResolvedAt().toString()));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}

