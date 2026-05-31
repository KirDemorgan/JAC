import { renderHook, act } from "@testing-library/react";
import { useAlerts } from "../index";
import * as apiClient from "../../../shared/api/client";
import type { Alert } from "../../../shared/types";

jest.mock("../../../shared/api/client", () => ({
  apiRequest: jest.fn(),
}));

const mockApiRequest = apiClient.apiRequest as jest.MockedFunction<
  typeof apiClient.apiRequest
>;

const makeAlert = (overrides: Partial<Alert> = {}): Alert => ({
  id: "alert-1",
  clientId: "client-1",
  eventId: "evt-1",
  severity: "high",
  message: "Запуск запрещенного процесса: hack.exe",
  status: "open",
  createdAt: new Date().toISOString(),
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe("useAlerts", () => {
  it("initializes with empty alerts", () => {
    const { result } = renderHook(() => useAlerts());
    expect(result.current.alerts).toEqual([]);
  });

  it("fetchAlerts populates state", async () => {
    const alerts = [makeAlert({ id: "a1" }), makeAlert({ id: "a2" })];
    mockApiRequest.mockResolvedValue({ alerts });

    const { result } = renderHook(() => useAlerts());
    await act(async () => { await result.current.fetchAlerts(); });

    expect(result.current.alerts).toHaveLength(2);
    expect(mockApiRequest).toHaveBeenCalledWith(
      expect.stringContaining("/api/alerts")
    );
  });

  it("resolveAlert updates status to closed", async () => {
    const alerts = [makeAlert({ id: "a1", status: "open" })];
    mockApiRequest
      .mockResolvedValueOnce({ alerts }) // fetchAlerts
      .mockResolvedValueOnce(null); // resolveAlert

    const { result } = renderHook(() => useAlerts());
    await act(async () => { await result.current.fetchAlerts(); });
    await act(async () => { await result.current.resolveAlert("a1"); });

    expect(result.current.alerts[0].status).toBe("closed");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/alerts/a1/resolve",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("addAlert prepends to list", () => {
    const { result } = renderHook(() => useAlerts());
    const newAlert = makeAlert({ id: "new-1" });

    act(() => { result.current.addAlert(newAlert); });

    expect(result.current.alerts[0]).toEqual(newAlert);
  });

  it("addAlert keeps newest at index 0", async () => {
    const { result } = renderHook(() => useAlerts());

    act(() => { result.current.addAlert(makeAlert({ id: "first" })); });
    act(() => { result.current.addAlert(makeAlert({ id: "second" })); });

    expect(result.current.alerts[0].id).toBe("second");
    expect(result.current.alerts[1].id).toBe("first");
  });

  it("clearAlerts empties the list", async () => {
    mockApiRequest.mockResolvedValue({ alerts: [makeAlert()] });
    const { result } = renderHook(() => useAlerts());
    await act(async () => { await result.current.fetchAlerts(); });

    act(() => { result.current.clearAlerts(); });

    expect(result.current.alerts).toEqual([]);
  });

  it("fetchAlerts is a no-op on null response", async () => {
    mockApiRequest.mockResolvedValue(null);
    const { result } = renderHook(() => useAlerts());
    await act(async () => { await result.current.fetchAlerts(); });
    expect(result.current.alerts).toEqual([]);
  });
});
