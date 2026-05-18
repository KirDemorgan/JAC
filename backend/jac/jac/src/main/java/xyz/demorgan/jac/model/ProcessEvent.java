package xyz.demorgan.jac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "process_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessEvent {
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "event_id")
    private String eventId;

    @Column(name = "client_id")
    private UUID clientId;

    @Column(name = "process_name")
    private String processName;

    private Integer pid;
    private String path;
    private String cmdline;
    private String user;
    private String status;
    private Boolean matchesForbidden;
    private Instant startTime;
    private Instant endTime;

    @Column(columnDefinition = "jsonb")
    private String meta;

    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) this.id = UUID.randomUUID();
        if (this.createdAt == null) this.createdAt = Instant.now();
        if (this.matchesForbidden == null) this.matchesForbidden = Boolean.FALSE;
    }
}

