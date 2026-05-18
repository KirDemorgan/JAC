package xyz.demorgan.jac;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.web.client.RestTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import xyz.demorgan.jac.dto.ClientRegisterRequest;
import xyz.demorgan.jac.dto.ProcessEventRequest;
import xyz.demorgan.jac.model.Alert;
import xyz.demorgan.jac.repository.AlertRepository;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
public class AgentIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("testdb")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void setProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @LocalServerPort
    int port;

    RestTemplate rest = new RestTemplate();

    @Autowired
    AlertRepository alertRepository;

    @Test
    public void registrationHeartbeatEventCreatesAlert() throws Exception {
        ClientRegisterRequest req = new ClientRegisterRequest();
        req.setHostname("TEST-HOST");
        req.setUsername("ivan");

        var r = rest.postForEntity("http://localhost:" + port + "/api/clients/register", req, Map.class);
        assertThat(r.getStatusCode().is2xxSuccessful()).isTrue();
        Map body = r.getBody();
        assertThat(body).containsKey("clientId");
        assertThat(body).containsKey("apiKey");

        String clientId = (String) body.get("clientId");
        String apiKey = (String) body.get("apiKey");

        // heartbeat
        var headers = new org.springframework.http.HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        var hb = Map.of("timestamp", java.time.Instant.now().toString(), "uptimeSeconds", 10);
        var ent = new org.springframework.http.HttpEntity<>(hb, headers);
        var hr = rest.postForEntity("http://localhost:" + port + "/api/clients/" + clientId + "/heartbeat", ent, Map.class);
        assertThat(hr.getStatusCode().is2xxSuccessful()).isTrue();

        // create forbidden rule via admin direct repo? use API: need admin JWT - use env default admin/admin
        var login = Map.of("username", System.getenv().getOrDefault("ADMIN_USER","admin"), "password", System.getenv().getOrDefault("ADMIN_PASSWORD","admin"));
        var loginResp = rest.postForEntity("http://localhost:" + port + "/auth/login", login, Map.class);
        assertThat(loginResp.getStatusCode().is2xxSuccessful()).isTrue();
        String token = (String) loginResp.getBody().get("token");

        var fp = Map.of("pattern","bad.exe","matchType","exact","enabled",true);
        var headersAdmin = new org.springframework.http.HttpHeaders();
        headersAdmin.setBearerAuth(token);
        headersAdmin.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        var createFp = new org.springframework.http.HttpEntity<>(fp, headersAdmin);
        var cr = rest.postForEntity("http://localhost:" + port + "/api/forbidden-processes", createFp, Map.class);
        assertThat(cr.getStatusCode().value()).isEqualTo(201);

        // send process-event that matches
        ProcessEventRequest ev = new ProcessEventRequest();
        ev.setEventId("evt-1");
        ev.setProcessName("bad.exe");
        ev.setStatus("forbidden_detected");
        var entEv = new org.springframework.http.HttpEntity<>(ev, headers);
        var er = rest.postForEntity("http://localhost:" + port + "/api/clients/" + clientId + "/process-event", entEv, Map.class);
        assertThat(er.getStatusCode().value()).isEqualTo(201);

        // check alert created in DB
        Thread.sleep(500); // brief wait
        var alerts = alertRepository.findAll();
        assertThat(alerts).isNotEmpty();
        Alert a = alerts.get(0);
        assertThat(a.getMessage()).contains("Forbidden process");
    }
}

