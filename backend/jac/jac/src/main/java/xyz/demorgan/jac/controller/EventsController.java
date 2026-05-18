package xyz.demorgan.jac.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import xyz.demorgan.jac.dto.ProcessEventRequest;
import xyz.demorgan.jac.model.ProcessEvent;
import xyz.demorgan.jac.service.EventService;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/clients/{clientId}")
public class EventsController {
    private final EventService eventService;

    public EventsController(EventService eventService) {
        this.eventService = eventService;
    }

    @PostMapping("/process-event")
    public ResponseEntity<?> processEvent(@PathVariable String clientId,
                                          @jakarta.validation.Valid @RequestBody ProcessEventRequest req,
                                          Authentication authentication) {
        // ensure auth client matches path
        if (authentication == null || !clientId.equals(authentication.getPrincipal())) {
            return ResponseEntity.status(403).build();
        }

        ProcessEvent ev = ProcessEvent.builder()
                .processName(req.getProcessName())
                .pid(req.getPid())
                .path(req.getPath())
                .cmdline(req.getCmdline())
                .user(req.getUser())
                .status(req.getStatus())
                .build();

        if (req.getStartTime() != null) {
            try { ev.setStartTime(Instant.parse(req.getStartTime())); } catch (Exception ignored) {}
        }
        if (req.getEndTime() != null) {
            try { ev.setEndTime(Instant.parse(req.getEndTime())); } catch (Exception ignored) {}
        }

        UUID cid = UUID.fromString(clientId);
        ProcessEvent saved = eventService.ingest(cid, req.getEventId(), ev);
        if (saved == null) return ResponseEntity.ok().body(Map.of("action","duplicate"));

        String action = saved.getMatchesForbidden() != null && saved.getMatchesForbidden() ? "alerted" : "logged";
        return ResponseEntity.status(201).body(Map.of("eventId", saved.getId().toString(), "action", action));
    }
}

