package xyz.demorgan.jac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "clients")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Client {
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "client_id", unique = true)
    private String clientId; // optional client-provided id

    @Column(nullable = false)
    private String hostname;

    private String username;
    private String os;
    private String osVersion;
    private String arch;
    private String appVersion;

    @Column(name = "ipinet")
    private String ip;

    private Boolean connected;

    private Instant lastSeen;

    private String tags; // json string for now

    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) this.id = UUID.randomUUID();
        if (this.createdAt == null) this.createdAt = Instant.now();
        if (this.connected == null) this.connected = Boolean.FALSE;
    }

    public UUID getId() {
        return this.id;
    }

    public String getClientId() {
        return this.clientId;
    }
}

