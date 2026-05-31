import { renderHook, act } from "@testing-library/react";
import { useClients } from "../index";
import * as apiClient from "../../../shared/api/client";
import type { ClientDevice } from "../../../shared/types";

jest.mock("../../../shared/api/client", () => ({
  apiRequest: jest.fn(),
}));

const mockApiRequest = apiClient.apiRequest as jest.MockedFunction<
  typeof apiClient.apiRequest
>;

const makeClient = (overrides: Partial<ClientDevice> = {}): ClientDevice => ({
  id: "client-uuid-1",
  clientId: "client-uuid-1",
  hostname: "WORKSTATION-01",
  username: "testuser",
  os: "Windows",
  osVersion: "11",
  arch: "x86_64",
  appVersion: "1.0.0",
  ip: "192.168.1.100",
  connected: true,
  lastSeen: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe("useClients", () => {
  it("initializes with empty state", () => {
    const { result } = renderHook(() => useClients());
    expect(result.current.clients).toEqual([]);
    expect(result.current.selectedClient).toBeNull();
    expect(result.current.selectedClientEvents).toEqual([]);
  });

  it("fetchClients populates list from paginated response", async () => {
    const clients = [makeClient(), makeClient({ id: "client-2", clientId: "client-2" })];
    mockApiRequest.mockResolvedValue({ clients, page: 0, size: 100, total: 2 });

    const { result } = renderHook(() => useClients());
    await act(async () => { await result.current.fetchClients(); });

    expect(result.current.clients).toHaveLength(2);
  });

  it("fetchClients handles flat array response", async () => {
    const clients = [makeClient()];
    mockApiRequest.mockResolvedValue(clients);

    const { result } = renderHook(() => useClients());
    await act(async () => { await result.current.fetchClients(); });

    expect(result.current.clients).toHaveLength(1);
  });

  it("updateClientStatus marks client online", async () => {
    mockApiRequest.mockResolvedValue({ clients: [makeClient({ connected: false })] });

    const { result } = renderHook(() => useClients());
    await act(async () => { await result.current.fetchClients(); });

    act(() => {
      result.current.updateClientStatus("client-uuid-1", true, new Date().toISOString());
    });

    expect(result.current.clients[0].connected).toBe(true);
  });

  it("updateClientStatus works by clientId field too", async () => {
    const c = makeClient({ id: "id-1", clientId: "cid-1", connected: true });
    mockApiRequest.mockResolvedValue({ clients: [c] });

    const { result } = renderHook(() => useClients());
    await act(async () => { await result.current.fetchClients(); });

    act(() => {
      result.current.updateClientStatus("cid-1", false);
    });

    expect(result.current.clients[0].connected).toBe(false);
  });

  it("viewClientDetails sets selectedClient and fetches events", async () => {
    const client = makeClient();
    const events = [{ id: "ev1", clientId: "client-uuid-1", processName: "hack.exe", pid: 123, status: "KILLED", matchesForbidden: true, startTime: new Date().toISOString(), createdAt: new Date().toISOString() }];
    mockApiRequest.mockResolvedValue({ events });

    const { result } = renderHook(() => useClients());
    await act(async () => { await result.current.viewClientDetails(client); });

    expect(result.current.selectedClient).toEqual(client);
    expect(result.current.selectedClientEvents).toEqual(events);
  });

  it("closeClientDetails resets selected state", async () => {
    const client = makeClient();
    mockApiRequest.mockResolvedValue({ events: [] });

    const { result } = renderHook(() => useClients());
    await act(async () => { await result.current.viewClientDetails(client); });

    act(() => { result.current.closeClientDetails(); });

    expect(result.current.selectedClient).toBeNull();
    expect(result.current.selectedClientEvents).toEqual([]);
  });

  it("clearClients empties all state", async () => {
    mockApiRequest.mockResolvedValue({ clients: [makeClient()] });
    const { result } = renderHook(() => useClients());
    await act(async () => { await result.current.fetchClients(); });

    act(() => { result.current.clearClients(); });

    expect(result.current.clients).toEqual([]);
  });

  it("rotateKey calls correct endpoint", async () => {
    mockApiRequest.mockResolvedValue({ newApiKey: "new-key" });

    const { result } = renderHook(() => useClients());
    await act(async () => { await result.current.rotateKey("client-uuid-1"); });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/clients/client-uuid-1/rotate-key",
      expect.objectContaining({ method: "POST" })
    );
  });
});
