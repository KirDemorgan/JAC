import { renderHook, act } from "@testing-library/react";
import { useRules } from "../index";
import * as apiClient from "../../../shared/api/client";
import type { ForbiddenProcess } from "../../../shared/types";

jest.mock("../../../shared/api/client", () => ({
  apiRequest: jest.fn(),
}));

const mockApiRequest = apiClient.apiRequest as jest.MockedFunction<
  typeof apiClient.apiRequest
>;

const makeRule = (overrides: Partial<ForbiddenProcess> = {}): ForbiddenProcess => ({
  id: 1,
  pattern: "cheatengine.exe",
  matchType: "contains",
  enabled: true,
  severity: "high",
  description: "Cheat engine",
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe("useRules", () => {
  it("initializes with correct defaults", () => {
    const { result } = renderHook(() => useRules());
    expect(result.current.rules).toEqual([]);
    expect(result.current.newPattern).toBe("");
    expect(result.current.newMatchType).toBe("contains");
    expect(result.current.newSeverity).toBe("medium");
    expect(result.current.addingRule).toBe(false);
  });

  it("fetchRules populates list", async () => {
    const rules = [makeRule(), makeRule({ id: 2, pattern: "hack.exe" })];
    mockApiRequest.mockResolvedValue(rules);

    const { result } = renderHook(() => useRules());
    await act(async () => { await result.current.fetchRules(); });

    expect(result.current.rules).toHaveLength(2);
  });

  it("addRule sends correct payload and adds to list", async () => {
    const created = makeRule({ id: 99, pattern: "malware.exe" });
    mockApiRequest.mockResolvedValue(created);

    const { result } = renderHook(() => useRules());

    act(() => {
      result.current.setNewPattern("malware.exe");
      result.current.setNewSeverity("high");
    });

    await act(async () => { await result.current.addRule(); });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/forbidden-processes",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"pattern":"malware.exe"'),
      })
    );
    expect(result.current.rules).toContainEqual(created);
    expect(result.current.newPattern).toBe(""); // reset after add
  });

  it("addRule is a no-op for empty pattern", async () => {
    const { result } = renderHook(() => useRules());

    act(() => { result.current.setNewPattern("   "); });
    await act(async () => { await result.current.addRule(); });

    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it("deleteRule removes from list", async () => {
    const rules = [makeRule({ id: 1 }), makeRule({ id: 2, pattern: "other.exe" })];
    mockApiRequest
      .mockResolvedValueOnce(rules)        // fetchRules
      .mockResolvedValueOnce(null);         // deleteRule

    const { result } = renderHook(() => useRules());
    await act(async () => { await result.current.fetchRules(); });
    await act(async () => { await result.current.deleteRule(1); });

    expect(result.current.rules).toHaveLength(1);
    expect(result.current.rules[0].id).toBe(2);
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/forbidden-processes/1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("clearRules empties list", async () => {
    mockApiRequest.mockResolvedValue([makeRule()]);
    const { result } = renderHook(() => useRules());
    await act(async () => { await result.current.fetchRules(); });

    act(() => { result.current.clearRules(); });
    expect(result.current.rules).toEqual([]);
  });

  it("addingRule flag is true during request", async () => {
    let resolve!: (v: unknown) => void;
    mockApiRequest.mockReturnValue(new Promise((r) => { resolve = r; }));

    const { result } = renderHook(() => useRules());
    act(() => { result.current.setNewPattern("hack.exe"); });

    act(() => { void result.current.addRule(); });
    expect(result.current.addingRule).toBe(true);

    await act(async () => { resolve(makeRule()); });
    expect(result.current.addingRule).toBe(false);
  });
});
