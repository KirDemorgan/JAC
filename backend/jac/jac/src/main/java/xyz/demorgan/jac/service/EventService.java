package xyz.demorgan.jac.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.demorgan.jac.model.IdempotencyKey;
import xyz.demorgan.jac.model.ProcessEvent;
import xyz.demorgan.jac.repository.IdempotencyKeyRepository;
import xyz.demorgan.jac.repository.ProcessEventRepository;
import xyz.demorgan.jac.repository.ForbiddenProcessRepository;
import xyz.demorgan.jac.model.ForbiddenProcess;

import java.time.Instant;
import java.util.Map;
import xyz.demorgan.jac.model.Alert;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class EventService {
    private final ProcessEventRepository processEventRepository;
    private final IdempotencyKeyRepository idempotencyKeyRepository;
    private final ForbiddenProcessRepository forbiddenProcessRepository;

    private final xyz.demorgan.jac.repository.AlertRepository alertRepository;
    private final xyz.demorgan.jac.service.RealtimeService realtimeService;

    public EventService(ProcessEventRepository processEventRepository,
                        IdempotencyKeyRepository idempotencyKeyRepository,
                        ForbiddenProcessRepository forbiddenProcessRepository,
                        xyz.demorgan.jac.repository.AlertRepository alertRepository,
                        xyz.demorgan.jac.service.RealtimeService realtimeService) {
        this.processEventRepository = processEventRepository;
        this.idempotencyKeyRepository = idempotencyKeyRepository;
        this.forbiddenProcessRepository = forbiddenProcessRepository;
        this.alertRepository = alertRepository;
        this.realtimeService = realtimeService;
    }

    @Transactional
    public ProcessEvent ingest(UUID clientId, String eventId, ProcessEvent payload) {
        if (eventId != null) {
            Optional<IdempotencyKey> existing = idempotencyKeyRepository.findByClientIdAndRequestKeyAndEndpoint(clientId, eventId, "process-event");
            if (existing.isPresent()) {
                // return existing recorded event if present
                // try to find matching event by eventId
                return processEventRepository.findByEventIdAndClientId(eventId, clientId).orElse(null);
            }
        }

        // apply simple forbidden rules matching
        List<ForbiddenProcess> rules = forbiddenProcessRepository.findByEnabledTrue();
        boolean matches = false;
        for (ForbiddenProcess r : rules) {
            if (r.getMatchType() == null) continue;
            String mt = r.getMatchType();
            if ("exact".equalsIgnoreCase(mt) && r.getPattern() != null && r.getPattern().equalsIgnoreCase(payload.getProcessName())) {
                matches = true; break;
            }
            if ("contains".equalsIgnoreCase(mt) && r.getPattern() != null && payload.getProcessName() != null && payload.getProcessName().toLowerCase().contains(r.getPattern().toLowerCase())) {
                matches = true; break;
            }
            if ("regex".equalsIgnoreCase(mt) && r.getPattern() != null) {
                try {
                    if (payload.getProcessName() != null && payload.getProcessName().matches(r.getPattern())) { matches = true; break; }
                } catch (Exception ignored) {}
            }
        }

        payload.setClientId(clientId);
        payload.setEventId(eventId);
        payload.setMatchesForbidden(matches);
        payload.setCreatedAt(Instant.now());

        ProcessEvent saved = processEventRepository.save(payload);

        if (matches) {
            // create alert
            try {
                Alert a = Alert.builder()
                        .clientId(clientId)
                        .eventId(saved.getId())
                        .severity("high")
                        .message("Forbidden process started: " + saved.getProcessName())
                        .status("open")
                        .meta(null)
                        .build();
                alertRepository.save(a);
                try { realtimeService.publish(Map.of("type","alert.created","payload", a)); } catch (Exception ignored) {}
            } catch (Exception ignored) {}
        }

        if (eventId != null) {
            IdempotencyKey key = IdempotencyKey.builder()
                    .id(UUID.randomUUID())
                    .clientId(clientId)
                    .requestKey(eventId)
                    .endpoint("process-event")
                    .createdAt(Instant.now())
                    .responseSnapshot(null)
                    .build();
            idempotencyKeyRepository.save(key);
        }

        return saved;
    }
}

