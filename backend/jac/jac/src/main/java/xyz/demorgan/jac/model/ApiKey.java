package xyz.demorgan.jac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "api_keys")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiKey {
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "client_id")
    private UUID clientId;

    @Column(name = "key_hash", nullable = false)
    private String keyHash;

    private Instant createdAt;

    private Boolean revoked;

    private Instant expiresAt;

    public Boolean getRevoked() {
        return revoked;
    }

    public String getKeyHash() {
        return keyHash;
    }

    public UUID getClientId() {
        return clientId;
    }
}
