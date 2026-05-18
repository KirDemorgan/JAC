package xyz.demorgan.jac.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import xyz.demorgan.jac.auth.JwtUtil;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final JwtUtil jwtUtil;

    public AuthController(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody java.util.Map<String, String> body) {
        String user = body.get("username");
        String pass = body.get("password");
        String adminUser = System.getenv().getOrDefault("ADMIN_USER", "admin");
        String adminPass = System.getenv().getOrDefault("ADMIN_PASSWORD", "admin");
        if (user == null || pass == null) return ResponseEntity.badRequest().build();
        if (!adminUser.equals(user) || !adminPass.equals(pass)) return ResponseEntity.status(401).build();

        String token = jwtUtil.generateToken(user, List.of("ROLE_ADMIN"), 1000L * 60 * 60);
        return ResponseEntity.ok(Map.of("token", token, "expiresAt", java.time.Instant.now().plusSeconds(3600).toString(), "roles", List.of("ROLE_ADMIN")));
    }
}

