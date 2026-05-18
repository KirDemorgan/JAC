package xyz.demorgan.jac.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import xyz.demorgan.jac.service.RealtimeService;

@RestController
@RequestMapping("/sse")
public class RealtimeController {
    private final RealtimeService realtimeService;

    public RealtimeController(RealtimeService realtimeService) {
        this.realtimeService = realtimeService;
    }

    @GetMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> subscribe(@RequestHeader(value = "Authorization", required = false) String auth, Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        SseEmitter emitter = realtimeService.subscribe();
        return ResponseEntity.ok(emitter);
    }
}

