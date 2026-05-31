"use client";

import { useState, useCallback } from "react";
import { apiRequest } from "../../shared/api/client";
import type { Alert } from "../../shared/types";

export interface AlertsState {
  alerts: Alert[];
  fetchAlerts: () => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  addAlert: (alert: Alert) => void;
  clearAlerts: () => void;
}

export function useAlerts(): AlertsState {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const fetchAlerts = useCallback(async () => {
    const data = await apiRequest<{ alerts: Alert[] }>(
      "/api/alerts?status=all&page=0&size=100"
    );
    if (data?.alerts) setAlerts(data.alerts);
  }, []);

  const resolveAlert = useCallback(async (id: string) => {
    await apiRequest(`/api/alerts/${id}/resolve`, {
      method: "POST",
      body: "{}",
    });
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "closed" as const } : a))
    );
  }, []);

  const addAlert = useCallback((alert: Alert) => {
    setAlerts((prev) => [alert, ...prev]);
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return { alerts, fetchAlerts, resolveAlert, addAlert, clearAlerts };
}
