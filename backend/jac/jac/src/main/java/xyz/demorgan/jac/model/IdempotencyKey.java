package xyz.demorgan.jac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "idempotency_keys", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"client_id","request_key","endpoint"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IdempotencyKey {
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "client_id")
    private UUID clientId;

    @Column(name = "request_key")
    private String requestKey;

    private String endpoint;

    private Instant createdAt;

    @Column(columnDefinition = "jsonb")
    private String responseSnapshot;

    @PrePersist
    public void prePersist() {
        if (this.id == null) this.id = UUID.randomUUID();
        if (this.createdAt == null) this.createdAt = Instant.now();
    }
}

