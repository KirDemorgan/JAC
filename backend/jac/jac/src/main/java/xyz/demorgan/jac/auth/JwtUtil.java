package xyz.demorgan.jac.auth;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;

@Component
public class JwtUtil {
    @Value("${JWT_SECRET:secret}")
    private String jwtSecret;

    public String generateToken(String username, List<String> roles, long ttlMillis) {
        Algorithm alg = Algorithm.HMAC256(jwtSecret.getBytes());
        Date now = new Date();
        Date exp = new Date(now.getTime() + ttlMillis);
        return JWT.create()
                .withSubject(username)
                .withClaim("roles", roles)
                .withIssuedAt(now)
                .withExpiresAt(exp)
                .sign(alg);
    }

    public DecodedJWT verify(String token) throws JWTVerificationException {
        Algorithm alg = Algorithm.HMAC256(jwtSecret.getBytes());
        JWTVerifier verifier = JWT.require(alg).build();
        return verifier.verify(token);
    }
}

