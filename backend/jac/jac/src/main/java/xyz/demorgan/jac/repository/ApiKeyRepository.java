package xyz.demorgan.jac.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import xyz.demorgan.jac.model.ApiKey;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, UUID> {
    Optional<ApiKey> findByClientIdAndRevokedFalse(UUID clientId);
    Optional<ApiKey> findByIdAndRevokedFalse(UUID id);
}

