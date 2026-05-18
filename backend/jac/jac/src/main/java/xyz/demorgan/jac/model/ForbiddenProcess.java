package xyz.demorgan.jac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "forbidden_processes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForbiddenProcess {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String pattern;
    private String matchType; // exact|contains|regex
    private Boolean enabled;
    private String severity;
    private String description;
    private String createdBy;
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (this.enabled == null) this.enabled = Boolean.TRUE;
        if (this.createdAt == null) this.createdAt = Instant.now();
    }
}

