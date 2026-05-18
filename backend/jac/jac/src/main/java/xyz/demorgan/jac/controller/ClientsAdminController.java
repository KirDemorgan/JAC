package xyz.demorgan.jac.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import xyz.demorgan.jac.model.Client;
import xyz.demorgan.jac.repository.ClientRepository;
import xyz.demorgan.jac.repository.ApiKeyRepository;
import xyz.demorgan.jac.service.ApiKeyService;

import java.util.List;
import xyz.demorgan.jac.repository.ForbiddenProcessRepository;
import xyz.demorgan.jac.repository.ProcessEventRepository;
import java.security.MessageDigest;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.UUID;
import java.time.Instant;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/clients")
public class ClientsAdminController {
    private final ClientRepository clientRepository;
    private final ApiKeyRepository apiKeyRepo;
    private final ApiKeyService apiKeyService;
    private final ForbiddenProcessRepository forbiddenRepo;
    private final ProcessEventRepository processEventRepository;

    public ClientsAdminController(ClientRepository clientRepository, ApiKeyRepository apiKeyRepo, ApiKeyService apiKeyService, ForbiddenProcessRepository forbiddenRepo, ProcessEventRepository processEventRepository) {
        this.clientRepository = clientRepository;
        this.apiKeyRepo = apiKeyRepo;
        this.apiKeyService = apiKeyService;
        this.forbiddenRepo = forbiddenRepo;
        this.processEventRepository = processEventRepository;
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        PageRequest pr = PageRequest.of(page, size);
        Page<Client> p = clientRepository.findAll(pr);
        return ResponseEntity.ok(Map.of("page", p.getNumber(), "size", p.getSize(), "total", p.getTotalElements(), "clients", p.getContent()));
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{clientId}")
    public ResponseEntity<?> get(@PathVariable String clientId) {
        try {
            java.util.UUID id = java.util.UUID.fromString(clientId);
            return clientRepository.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{clientId}/events")
    public ResponseEntity<?> events(@PathVariable String clientId, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        try {
            UUID id = UUID.fromString(clientId);
            var p = processEventRepository.findByClientId(id, PageRequest.of(page, size));
            return ResponseEntity.ok(Map.of("page", p.getNumber(), "size", p.getSize(), "total", p.getTotalElements(), "events", p.getContent()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{clientId}/config")
    public ResponseEntity<?> config(@PathVariable String clientId) {
        try {
            UUID id = UUID.fromString(clientId);
            var list = forbiddenRepo.findAll().stream().filter(fp -> Boolean.TRUE.equals(fp.getEnabled())).collect(Collectors.toList());
            // compute simple checksum of patterns
            String concat = list.stream().map(fp -> fp.getPattern() + ":" + fp.getMatchType()).collect(Collectors.joining("|"));
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(concat.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(); for (byte b : digest) sb.append(String.format("%02x", b));
            return ResponseEntity.ok(Map.of("clientId", clientId, "forbiddenChecksum", sb.toString(), "forbiddenList", list, "serverTime", Instant.now().toString()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{clientId}/rotate-key")
    public ResponseEntity<?> rotateKey(@PathVariable String clientId, @RequestBody(required = false) Map<String, Object> body) {
        try {
            java.util.UUID id = java.util.UUID.fromString(clientId);
            return clientRepository.findById(id).map(c -> {
                boolean revokeOld = body != null && Boolean.TRUE.equals(body.get("revokeOld"));
                // revoke existing keys
                apiKeyRepo.findByClientIdAndRevokedFalse(id).ifPresent(k -> { k.setRevoked(true); apiKeyRepo.save(k); });
                String newToken = apiKeyService.generateAndStore(id);
                return ResponseEntity.ok(Map.of("clientId", clientId, "newApiKey", newToken, "issuedAt", Instant.now().toString()));
            }).orElseGet(() -> ResponseEntity.notFound().build());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }
}




