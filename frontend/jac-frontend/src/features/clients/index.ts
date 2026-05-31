"use client";

import { useState, useCallback } from "react";
import { apiRequest } from "../../shared/api/client";
import type { ClientDevice, ProcessEvent } from "../../shared/types";

export interface ClientsState {
  clients: ClientDevice[];
  selectedClient: ClientDevice | null;
  selectedClientEvents: ProcessEvent[];
  fetchClients: () => Promise<void>;
  updateClientStatus: (
    clientId: string,
    connected: boolean,
    lastSeen?: string
  ) => void;
  viewClientDetails: (client: ClientDevice) => Promise<void>;
  closeClientDetails: () => void;
  clearClients: () => void;
  rotateKey: (clientId: string) => Promise<void>;
}

export function useClients(): ClientsState {
  const [clients, setClients] = useState<ClientDevice[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientDevice | null>(
    null
  );
  const [selectedClientEvents, setSelectedClientEvents] = useState<
    ProcessEvent[]
  >([]);

  const fetchClients = useCallback(async () => {
    const data = await apiRequest<
      { clients: ClientDevice[] } | ClientDevice[]
    >("/api/clients?page=0&size=100");
    if (!data) return;
    if (Array.isArray(data)) {
      setClients(data);
    } else if ("clients" in data) {
      setClients(data.clients);
    }
  }, []);

  const updateClientStatus = useCallback(
    (clientId: string, connected: boolean, lastSeen?: string) => {
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId || c.clientId === clientId
            ? { ...c, connected, lastSeen: lastSeen ?? c.lastSeen }
            : c
        )
      );
      setSelectedClient((prev) =>
        prev && (prev.id === clientId || prev.clientId === clientId)
          ? { ...prev, connected, lastSeen: lastSeen ?? prev.lastSeen }
          : prev
      );
    },
    []
  );

  const viewClientDetails = useCallback(async (client: ClientDevice) => {
    setSelectedClient(client);
    setSelectedClientEvents([]);
    const data = await apiRequest<{ events: ProcessEvent[] }>(
      `/api/clients/${client.id}/events?page=0&size=50`
    );
    setSelectedClientEvents(data?.events ?? []);
  }, []);

  const closeClientDetails = useCallback(() => {
    setSelectedClient(null);
    setSelectedClientEvents([]);
  }, []);

  const clearClients = useCallback(() => {
    setClients([]);
    setSelectedClient(null);
    setSelectedClientEvents([]);
  }, []);

  const rotateKey = useCallback(async (clientId: string) => {
    await apiRequest(`/api/clients/${clientId}/rotate-key`, {
      method: "POST",
      body: JSON.stringify({ revokeOld: true }),
    });
  }, []);

  return {
    clients,
    selectedClient,
    selectedClientEvents,
    fetchClients,
    updateClientStatus,
    viewClientDetails,
    closeClientDetails,
    clearClients,
    rotateKey,
  };
}
