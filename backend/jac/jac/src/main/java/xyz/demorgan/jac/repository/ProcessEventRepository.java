package xyz.demorgan.jac.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import xyz.demorgan.jac.model.ProcessEvent;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProcessEventRepository extends JpaRepository<ProcessEvent, UUID> {
    Optional<ProcessEvent> findByEventIdAndClientId(String eventId, UUID clientId);
    org.springframework.data.domain.Page<ProcessEvent> findByClientId(UUID clientId, org.springframework.data.domain.Pageable pageable);
}

