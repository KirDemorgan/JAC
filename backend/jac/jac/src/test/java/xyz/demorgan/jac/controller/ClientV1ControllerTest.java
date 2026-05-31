package xyz.demorgan.jac.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import xyz.demorgan.jac.model.Client;
import xyz.demorgan.jac.model.ForbiddenProcess;
import xyz.demorgan.jac.repository.AlertRepository;
import xyz.demorgan.jac.repository.ClientRepository;
import xyz.demorgan.jac.repository.ForbiddenProcessRepository;
import xyz.demorgan.jac.repository.ProcessEventRepository;
import xyz.demorgan.jac.service.RealtimeService;

import java.time.Instant;
import java.util.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Slice tests for ClientV1Controller without security filters.
 * Tests the endpoint contract and business logic in isolation.
 */
@WebMvcTest(
        controllers = ClientV1Controller.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class
        }
)
class ClientV1ControllerTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper mapper;

    @MockBean
    ClientRepository clientRepository;

    @MockBean
    ForbiddenProcessRepository forbiddenRepository;

    @MockBean
    ProcessEventRepository processEventRepository;

    @MockBean
    AlertRepository alertRepository;

    @MockBean
    RealtimeService realtimeService;

    private final UUID clientUuid = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @BeforeEach
    void resetSessions() throws Exception {
        var field = ClientV1Controller.class.getDeclaredField("activeSessions");
        field.setAccessible(true);
        ((Map<?, ?>) field.get(null)).clear();
    }

    // ─── /api/v1/session/init ────────────────────────────────────────────────

    @Test
    void initSession_newClient_returns200WithSessionId() throws Exception {
        when(clientRepository.findById(clientUuid)).thenReturn(Optional.empty());
        when(clientRepository.save(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));

        mvc.perform(post("/api/v1/session/init")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("app_hash", clientUuid.toString(), "timestamp", 1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.session_id").isString())
                .andExpect(jsonPath("$.app_hash").value(clientUuid.toString()));

        verify(clientRepository).save(any(Client.class));
    }

    @Test
    void initSession_existingClient_updatesAndReturns200() throws Exception {
        Client existing = Client.builder()
                .id(clientUuid)
                .clientId(clientUuid.toString())
                .hostname("TEST")
                .username("u")
                .os("Windows").osVersion("11").arch("x64").appVersion("1.0")
                .connected(false)
                .createdAt(Instant.now())
                .build();

        when(clientRepository.findById(clientUuid)).thenReturn(Optional.of(existing));
        when(clientRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        mvc.perform(post("/api/v1/session/init")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("app_hash", clientUuid.toString(), "timestamp", 1)))
                .andExpect(status().isOk());

        verify(clientRepository).save(argThat(c -> Boolean.TRUE.equals(c.getConnected())));
    }

    @Test
    void initSession_missingAppHash_returns400() throws Exception {
        mvc.perform(post("/api/v1/session/init")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("timestamp", 1)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void initSession_invalidUuid_returns400() throws Exception {
        mvc.perform(post("/api/v1/session/init")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("app_hash", "not-a-uuid", "timestamp", 1)))
                .andExpect(status().isBadRequest());
    }

    // ─── /api/v1/forbidden-processes ────────────────────────────────────────

    @Test
    void getForbiddenProcesses_validSession_returnsList() throws Exception {
        String sessionId = initSession();

        ForbiddenProcess fp = new ForbiddenProcess();
        fp.setPattern("cheatengine.exe");
        fp.setEnabled(true);
        when(forbiddenRepository.findAll()).thenReturn(List.of(fp));

        mvc.perform(get("/api/v1/forbidden-processes")
                        .header("X-Session-ID", sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.processes[0]").value("cheatengine.exe"))
                .andExpect(jsonPath("$.last_updated").isString());
    }

    @Test
    void getForbiddenProcesses_filtersDisabledRules() throws Exception {
        String sessionId = initSession();

        ForbiddenProcess enabled = new ForbiddenProcess();
        enabled.setPattern("hack.exe");
        enabled.setEnabled(true);

        ForbiddenProcess disabled = new ForbiddenProcess();
        disabled.setPattern("legit.exe");
        disabled.setEnabled(false);

        when(forbiddenRepository.findAll()).thenReturn(List.of(enabled, disabled));

        mvc.perform(get("/api/v1/forbidden-processes")
                        .header("X-Session-ID", sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.processes.length()").value(1))
                .andExpect(jsonPath("$.processes[0]").value("hack.exe"));
    }

    @Test
    void getForbiddenProcesses_invalidSession_returns401() throws Exception {
        mvc.perform(get("/api/v1/forbidden-processes")
                        .header("X-Session-ID", "ghost"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getForbiddenProcesses_missingHeader_returns401() throws Exception {
        mvc.perform(get("/api/v1/forbidden-processes"))
                .andExpect(status().isUnauthorized());
    }

    // ─── /api/v1/heartbeat ──────────────────────────────────────────────────

    @Test
    void heartbeat_validSession_returns200AndUpdatesClient() throws Exception {
        String sessionId = initSession();

        Client client = Client.builder()
                .id(clientUuid).clientId(clientUuid.toString())
                .connected(false).lastSeen(Instant.now()).build();
        when(clientRepository.findById(clientUuid)).thenReturn(Optional.of(client));
        when(clientRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        mvc.perform(post("/api/v1/heartbeat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(
                                "session_id", sessionId,
                                "app_hash", clientUuid.toString(),
                                "timestamp", 1,
                                "status", "alive"
                        )))
                .andExpect(status().isOk());

        verify(clientRepository).save(argThat(c -> Boolean.TRUE.equals(c.getConnected())));
        verify(realtimeService).publish(argThat(evt -> typeEquals(evt, "heartbeat")));
    }

    @Test
    void heartbeat_invalidSession_returns401() throws Exception {
        mvc.perform(post("/api/v1/heartbeat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(
                                "session_id", "ghost",
                                "app_hash", clientUuid.toString(),
                                "timestamp", 1,
                                "status", "alive"
                        )))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void heartbeat_wrongAppHash_returns403() throws Exception {
        String sessionId = initSession();

        mvc.perform(post("/api/v1/heartbeat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(
                                "session_id", sessionId,
                                "app_hash", UUID.randomUUID().toString(), // wrong
                                "timestamp", 1,
                                "status", "alive"
                        )))
                .andExpect(status().isForbidden());
    }

    // ─── /api/v1/report/forbidden-processes ─────────────────────────────────

    @Test
    void report_createsEventsAndAlerts() throws Exception {
        String sessionId = initSession();

        when(processEventRepository.save(any())).thenAnswer(inv -> {
            xyz.demorgan.jac.model.ProcessEvent ev = inv.getArgument(0);
            ev.setId(UUID.randomUUID());
            return ev;
        });
        when(alertRepository.save(any())).thenAnswer(inv -> {
            xyz.demorgan.jac.model.Alert a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        mvc.perform(post("/api/v1/report/forbidden-processes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of(
                                "session_id", sessionId,
                                "app_hash", clientUuid.toString(),
                                "timestamp", 1,
                                "processes", List.of("cheatengine.exe", "hack.exe")
                        ))))
                .andExpect(status().isOk());

        verify(processEventRepository, times(2)).save(any());
        verify(alertRepository, times(2)).save(any());
        verify(realtimeService, times(2)).publish(argThat(e -> typeEquals(e, "alert")));
    }

    @Test
    void report_emptyProcessList_noSideEffects() throws Exception {
        String sessionId = initSession();

        mvc.perform(post("/api/v1/report/forbidden-processes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of(
                                "session_id", sessionId,
                                "app_hash", clientUuid.toString(),
                                "timestamp", 1,
                                "processes", List.of()
                        ))))
                .andExpect(status().isOk());

        verify(processEventRepository, never()).save(any());
        verify(alertRepository, never()).save(any());
    }

    @Test
    void report_invalidSession_returns401() throws Exception {
        mvc.perform(post("/api/v1/report/forbidden-processes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of(
                                "session_id", "ghost",
                                "app_hash", clientUuid.toString(),
                                "timestamp", 1,
                                "processes", List.of("x.exe")
                        ))))
                .andExpect(status().isUnauthorized());
    }

    // ─── /api/v1/session/close ──────────────────────────────────────────────

    @Test
    void closeSession_validSession_disconnectsClientAndBroadcasts() throws Exception {
        String sessionId = initSession();

        Client client = Client.builder()
                .id(clientUuid).clientId(clientUuid.toString())
                .connected(true).lastSeen(Instant.now()).build();
        when(clientRepository.findById(clientUuid)).thenReturn(Optional.of(client));
        when(clientRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        mvc.perform(post("/api/v1/session/close")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("session_id", sessionId, "timestamp", 1)))
                .andExpect(status().isOk());

        verify(clientRepository).save(argThat(c -> Boolean.FALSE.equals(c.getConnected())));
        verify(realtimeService).publish(argThat(e -> typeEquals(e, "client_disconnect")));
    }

    @Test
    void closeSession_invalidSession_returns401() throws Exception {
        mvc.perform(post("/api/v1/session/close")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("session_id", "ghost", "timestamp", 1)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void closeSession_removesSessionSoSubsequentCallsFail() throws Exception {
        String sessionId = initSession();

        Client client = Client.builder()
                .id(clientUuid).clientId(clientUuid.toString())
                .connected(true).lastSeen(Instant.now()).build();
        when(clientRepository.findById(clientUuid)).thenReturn(Optional.of(client));
        when(clientRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        mvc.perform(post("/api/v1/session/close")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("session_id", sessionId, "timestamp", 1)))
                .andExpect(status().isOk());

        // Second close with same session should fail
        mvc.perform(post("/api/v1/session/close")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("session_id", sessionId, "timestamp", 2)))
                .andExpect(status().isUnauthorized());
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    /** Registers a session and returns its session_id. */
    private String initSession() throws Exception {
        when(clientRepository.findById(clientUuid)).thenReturn(Optional.empty());
        when(clientRepository.save(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));

        var result = mvc.perform(post("/api/v1/session/init")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("app_hash", clientUuid.toString(), "timestamp", 1)))
                .andExpect(status().isOk())
                .andReturn();

        @SuppressWarnings("unchecked")
        Map<String, String> map = mapper.readValue(
                result.getResponse().getContentAsString(), Map.class);
        return map.get("session_id");
    }

    /** Builds a JSON string from alternating key/value pairs. */
    private String body(Object... kvPairs) throws Exception {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < kvPairs.length; i += 2) {
            m.put(kvPairs[i].toString(), kvPairs[i + 1]);
        }
        return mapper.writeValueAsString(m);
    }

    @SuppressWarnings("unchecked")
    private boolean typeEquals(Object event, String expectedType) {
        if (event instanceof Map<?, ?> m) {
            return expectedType.equals(m.get("type"));
        }
        return false;
    }
}
