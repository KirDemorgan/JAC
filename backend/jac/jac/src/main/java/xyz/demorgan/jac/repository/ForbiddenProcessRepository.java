package xyz.demorgan.jac.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import xyz.demorgan.jac.model.ForbiddenProcess;

import java.util.List;

@Repository
public interface ForbiddenProcessRepository extends JpaRepository<ForbiddenProcess, Long> {
    List<ForbiddenProcess> findByEnabledTrue();
}

