package xyz.demorgan.jac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    private String actor;
    private String action;

    private String target;

    @Column(columnDefinition = "jsonb")
    private String details;

    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) this.id = UUID.randomUUID();
        if (this.createdAt == null) this.createdAt = Instant.now();
    }
}

