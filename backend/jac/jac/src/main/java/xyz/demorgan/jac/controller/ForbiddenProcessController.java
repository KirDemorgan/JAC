package xyz.demorgan.jac.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import xyz.demorgan.jac.model.ForbiddenProcess;
import xyz.demorgan.jac.repository.ForbiddenProcessRepository;

import java.util.List;

@RestController
@RequestMapping("/api/forbidden-processes")
public class ForbiddenProcessController {
    private final ForbiddenProcessRepository repo;

    public ForbiddenProcessController(ForbiddenProcessRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<List<ForbiddenProcess>> list() {
        return ResponseEntity.ok(repo.findAll());
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ForbiddenProcess> create(@RequestBody ForbiddenProcess fp, Authentication auth) {
        fp.setCreatedBy(auth == null ? "system" : auth.getName());
        ForbiddenProcess saved = repo.save(fp);
        return ResponseEntity.status(201).body(saved);
    }

    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ForbiddenProcess> update(@PathVariable Long id, @RequestBody ForbiddenProcess fp) {
        return repo.findById(id).map(existing -> {
            if (fp.getPattern() != null) existing.setPattern(fp.getPattern());
            if (fp.getMatchType() != null) existing.setMatchType(fp.getMatchType());
            if (fp.getEnabled() != null) existing.setEnabled(fp.getEnabled());
            if (fp.getSeverity() != null) existing.setSeverity(fp.getSeverity());
            if (fp.getDescription() != null) existing.setDescription(fp.getDescription());
            repo.save(existing);
            return ResponseEntity.ok(existing);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return repo.findById(id).map(existing -> {
            existing.setEnabled(false);
            repo.save(existing);
            return ResponseEntity.noContent().build();
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}

