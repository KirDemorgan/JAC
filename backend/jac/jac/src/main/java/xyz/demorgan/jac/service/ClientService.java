package xyz.demorgan.jac.service;

import org.springframework.stereotype.Service;
import xyz.demorgan.jac.dto.ClientRegisterRequest;
import xyz.demorgan.jac.model.Client;
import xyz.demorgan.jac.repository.ClientRepository;

import java.time.Instant;
import java.util.UUID;

@Service
public class ClientService {
    private final ClientRepository clientRepository;

    public ClientService(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    public Client register(ClientRegisterRequest req) {
        if (req.getClientId() != null) {
            // if client provided id and exists, return existing
            return clientRepository.findByClientId(req.getClientId()).orElseGet(() -> createNew(req));
        }
        return createNew(req);
    }

    private Client createNew(ClientRegisterRequest req) {
        Client c = Client.builder()
                .id(UUID.randomUUID())
                .clientId(req.getClientId())
                .hostname(req.getHostname())
                .username(req.getUsername())
                .os(req.getOs())
                .osVersion(req.getOsVersion())
                .arch(req.getArch())
                .appVersion(req.getAppVersion())
                .ip(req.getIp())
                .tags(null)
                .lastSeen(Instant.now())
                .createdAt(Instant.now())
                .connected(true)
                .build();

        return clientRepository.save(c);
    }
}

