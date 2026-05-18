package xyz.demorgan.jac.service;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

@Service
public class RealtimeService {
    private final Set<SseEmitter> clients = new CopyOnWriteArraySet<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L);
        clients.add(emitter);
        emitter.onCompletion(() -> clients.remove(emitter));
        emitter.onTimeout(() -> clients.remove(emitter));
        return emitter;
    }

    public void publish(Object event) {
        for (SseEmitter e : clients) {
            try {
                e.send(event);
            } catch (IOException ex) {
                clients.remove(e);
            }
        }
    }
}

