package xyz.demorgan.jac.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import xyz.demorgan.jac.repository.ClientRepository;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/clients/{clientId}")
public class HeartbeatController {
    private final ClientRepository clientRepository;

    public HeartbeatController(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<?> heartbeat(@PathVariable String clientId, @RequestBody(required = false) Map<String, Object> body, Authentication authentication) {
        if (authentication == null || !clientId.equals(authentication.getPrincipal())) {
            return ResponseEntity.status(403).build();
        }

        UUID cid = UUID.fromString(clientId);
        return clientRepository.findById(cid).map(c -> {
            c.setLastSeen(Instant.now());
            c.setConnected(true);
            clientRepository.save(c);
            return ResponseEntity.ok(Map.of("status","ok","serverTime",Instant.now().toString(),"nextAction",null));
        }).orElseGet(() -> ResponseEntity.status(404).build());
    }
}

