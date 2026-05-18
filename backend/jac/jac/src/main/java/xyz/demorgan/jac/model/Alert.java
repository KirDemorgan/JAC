package xyz.demorgan.jac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Alert {
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "client_id")
    private UUID clientId;

    @Column(name = "event_id")
    private UUID eventId;

    private String severity;
    private String message;
    private String status;
    private Instant createdAt;
    private Instant resolvedAt;

    @Column(columnDefinition = "jsonb")
    private String meta;

    @PrePersist
    public void prePersist() {
        if (this.id == null) this.id = UUID.randomUUID();
        if (this.createdAt == null) this.createdAt = Instant.now();
        if (this.status == null) this.status = "open";
    }
}

