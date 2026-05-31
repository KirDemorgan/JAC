import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../index";
import * as apiClient from "../../../shared/api/client";

// Mock the API client module
jest.mock("../../../shared/api/client", () => ({
  apiRequest: jest.fn(),
  setApiToken: jest.fn(),
  setUnauthorizedHandler: jest.fn(),
}));

const mockApiRequest = apiClient.apiRequest as jest.MockedFunction<
  typeof apiClient.apiRequest
>;

// Minimal localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});

describe("useAuth", () => {
  it("initializes with null token when localStorage is empty", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.token).toBeNull();
  });

  it("initializes with stored token from localStorage", () => {
    localStorageMock.getItem.mockReturnValueOnce("stored-token");
    const { result } = renderHook(() => useAuth());
    expect(result.current.token).toBe("stored-token");
  });

  it("handleLogin sets token on success", async () => {
    mockApiRequest.mockResolvedValue({ token: "new-jwt" });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      result.current.setUsername("admin");
      result.current.setPassword("pass");
    });

    await act(async () => {
      await result.current.handleLogin();
    });

    expect(result.current.token).toBe("new-jwt");
    expect(localStorageMock.setItem).toHaveBeenCalledWith("jac_token", "new-jwt");
  });

  it("handleLogin sets loginError on API failure", async () => {
    mockApiRequest.mockRejectedValue(new Error("Invalid credentials"));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.handleLogin();
    });

    expect(result.current.loginError).toBe("Invalid credentials");
    expect(result.current.token).toBeNull();
  });

  it("handleLogin sets loginError when no token in response", async () => {
    mockApiRequest.mockResolvedValue({});

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.handleLogin();
    });

    expect(result.current.loginError).toBe("Invalid credentials");
  });

  it("handleLogin shows loading state during request", async () => {
    let resolveLogin!: (v: unknown) => void;
    mockApiRequest.mockReturnValue(
      new Promise((res) => { resolveLogin = res; })
    );

    const { result } = renderHook(() => useAuth());

    act(() => { void result.current.handleLogin(); });
    expect(result.current.loadingLogin).toBe(true);

    await act(async () => { resolveLogin({ token: "tok" }); });
    expect(result.current.loadingLogin).toBe(false);
  });

  it("handleLogout clears token and localStorage", async () => {
    mockApiRequest.mockResolvedValue({ token: "tok" });
    const { result } = renderHook(() => useAuth());

    await act(async () => { await result.current.handleLogin(); });
    expect(result.current.token).toBe("tok");

    act(() => { result.current.handleLogout(); });

    expect(result.current.token).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("jac_token");
    expect(apiClient.setApiToken).toHaveBeenCalledWith(null);
  });

  it("rememberMe=false does not persist token", async () => {
    mockApiRequest.mockResolvedValue({ token: "tok" });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      result.current.setRememberMe(false);
    });

    await act(async () => { await result.current.handleLogin(); });

    expect(localStorageMock.setItem).not.toHaveBeenCalledWith("jac_token", "tok");
  });
});
