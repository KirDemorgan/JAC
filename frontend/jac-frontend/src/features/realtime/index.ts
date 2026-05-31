"use client";

import { useState, useRef, useCallback } from "react";
import { API_BASE } from "../../shared/config";
import type { Alert, RealtimeStatus, TickerAlert } from "../../shared/types";

interface RealtimeOptions {
  token: string | null;
  onAlert: (alert: Alert) => void;
  onTickerAlert: (ticker: TickerAlert) => void;
  onHeartbeat: (clientId: string, timestamp: string) => void;
  onDisconnect: (clientId: string) => void;
  refreshClients: () => void;
  refreshLogs: () => void;
}

export interface RealtimeState {
  realtimeStatus: RealtimeStatus;
  connect: () => void;
  disconnect: () => void;
}

export function useRealtime(options: RealtimeOptions): RealtimeState {
  const [realtimeStatus, setRealtimeStatus] =
    useState<RealtimeStatus>("disconnected");
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep options stable in a ref so callbacks don't cause reconnect
  const optsRef = useRef(options);
  optsRef.current = options;

  const connect = useCallback(() => {
    const { token } = optsRef.current;
    if (!token) return;

    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    if (retryRef.current) {
      clearTimeout(retryRef.current);
      retryRef.current = null;
    }

    setRealtimeStatus("connecting");
    const url = `${API_BASE}/sse?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => setRealtimeStatus("connected");

    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as Record<string, unknown>;
        const opts = optsRef.current;

        switch (data.type) {
          case "heartbeat":
            opts.onHeartbeat(
              data.clientId as string,
              data.timestamp as string
            );
            break;
          case "alert": {
            const alert = data.data as Alert;
            if (alert) {
              opts.onAlert(alert);
              opts.onTickerAlert({
                id: alert.id ?? String(Math.random()),
                msg: (data.processName as string) ?? alert.message,
                time: new Date().toLocaleTimeString(),
                severity: alert.severity ?? "high",
              });
            }
            break;
          }
          case "client_disconnect":
            opts.onDisconnect(data.clientId as string);
            opts.refreshClients();
            break;
        }
      } catch {
        // malformed JSON — ignore
      }
    };

    es.onerror = () => {
      setRealtimeStatus("disconnected");
      esRef.current?.close();
      esRef.current = null;
      // Exponential back-off is skipped for simplicity — fixed 5 s retry
      retryRef.current = setTimeout(() => {
        if (optsRef.current.token) connect();
      }, 5000);
    };
  }, []);

  const disconnect = useCallback(() => {
    if (retryRef.current) {
      clearTimeout(retryRef.current);
      retryRef.current = null;
    }
    esRef.current?.close();
    esRef.current = null;
    setRealtimeStatus("disconnected");
  }, []);

  return { realtimeStatus, connect, disconnect };
}
