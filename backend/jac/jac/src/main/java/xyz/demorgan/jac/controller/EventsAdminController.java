package xyz.demorgan.jac.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import xyz.demorgan.jac.model.ProcessEvent;
import xyz.demorgan.jac.repository.ProcessEventRepository;

import java.util.Map;

/**
 * Admin endpoint: paginated feed of all process events across all clients.
 * Used by the dashboard Events tab.
 */
@RestController
@RequestMapping("/api/events")
public class EventsAdminController {

    private final ProcessEventRepository processEventRepository;

    public EventsAdminController(ProcessEventRepository processEventRepository) {
        this.processEventRepository = processEventRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<?> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size
    ) {
        PageRequest pr = PageRequest.of(page, Math.min(size, 500),
                Sort.by("createdAt").descending());
        Page<ProcessEvent> result = processEventRepository.findAll(pr);
        return ResponseEntity.ok(Map.of(
                "page", result.getNumber(),
                "size", result.getSize(),
                "total", result.getTotalElements(),
                "events", result.getContent()
        ));
    }
}
