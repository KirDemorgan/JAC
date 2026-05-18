package xyz.demorgan.jac.service;

import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;
import org.springframework.stereotype.Service;
import xyz.demorgan.jac.model.ApiKey;
import xyz.demorgan.jac.repository.ApiKeyRepository;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
public class ApiKeyService {
    private final ApiKeyRepository apiKeyRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public ApiKeyService(ApiKeyRepository apiKeyRepository) {
        this.apiKeyRepository = apiKeyRepository;
    }

    public String generateAndStore(UUID clientId) {
        // generate id and a random 32-byte secret, token format: {id}.{secret}
        UUID id = UUID.randomUUID();
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String secret = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        String token = id.toString() + "." + secret;

        // Hash the secret with Argon2 and store hash with id
        Argon2 argon2 = Argon2Factory.create();
        try {
            String hash = argon2.hash(2, 65536, 1, secret.toCharArray());

            ApiKey apiKey = ApiKey.builder()
                    .id(id)
                    .clientId(clientId)
                    .keyHash(hash)
                    .createdAt(Instant.now())
                    .revoked(false)
                    .build();

            apiKeyRepository.save(apiKey);
            return token;
        } finally {
            argon2.wipeArray(secret.toCharArray());
        }
    }

    public boolean verify(String token, String storedHash) {
        Argon2 argon2 = Argon2Factory.create();
        try {
            return argon2.verify(storedHash, token.toCharArray());
        } finally {
            argon2.wipeArray(token.toCharArray());
        }
    }

    /**
     * Verify full token in form {id}.{secret} and return clientId if valid.
     */
    public Optional<UUID> verifyTokenAndGetClientId(String fullToken) {
        if (fullToken == null) return Optional.empty();
        String[] parts = fullToken.split("\\.", 2);
        if (parts.length != 2) return Optional.empty();
        try {
            UUID id = UUID.fromString(parts[0]);
            String secret = parts[1];
            return apiKeyRepository.findById(id)
                    .filter(apiKey -> apiKey.getRevoked() != null && !apiKey.getRevoked() ? true : !Boolean.TRUE.equals(apiKey.getRevoked()))
                    .map(apiKey -> {
                        boolean ok = verify(secret, apiKey.getKeyHash());
                        return ok ? apiKey.getClientId() : null;
                    })
                    .map(Optional::ofNullable)
                    .orElse(Optional.empty());
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }
}

