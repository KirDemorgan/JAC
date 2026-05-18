package xyz.demorgan.jac.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import xyz.demorgan.jac.dto.ClientRegisterRequest;
import xyz.demorgan.jac.dto.ClientRegisterResponse;
import xyz.demorgan.jac.model.Client;
import xyz.demorgan.jac.service.ApiKeyService;
import xyz.demorgan.jac.service.ClientService;

import java.time.Instant;

@RestController
@RequestMapping("/api/clients")
public class ClientsController {
    private final ClientService clientService;
    private final ApiKeyService apiKeyService;

    public ClientsController(ClientService clientService, ApiKeyService apiKeyService) {
        this.clientService = clientService;
        this.apiKeyService = apiKeyService;
    }

    @PostMapping("/register")
    public ResponseEntity<ClientRegisterResponse> register(@jakarta.validation.Valid @RequestBody ClientRegisterRequest req) {

        Client client = clientService.register(req);

        // always generate new api key on registration when newly created, if existed return existing without apiKey
        boolean newlyCreated = req.getClientId() == null || !req.getClientId().equals(client.getClientId());

        ClientRegisterResponse resp = new ClientRegisterResponse();
        resp.setClientId(client.getId().toString());
        resp.setIssuedAt(Instant.now().toString());
        resp.setExpiresAt(null);

        if (newlyCreated) {
            String token = apiKeyService.generateAndStore(client.getId());
            resp.setApiKey(token);
            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } else {
            resp.setApiKey(null);
            return ResponseEntity.ok(resp);
        }
    }
}

