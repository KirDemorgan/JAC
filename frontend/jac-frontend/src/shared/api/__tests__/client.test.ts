import { apiRequest, setApiToken, setUnauthorizedHandler } from "../client";

// Minimal fetch mock
const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeResponse(
  body: unknown,
  status = 200
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
  setApiToken(null);
  setUnauthorizedHandler(() => {});
});

describe("apiRequest", () => {
  it("returns parsed JSON on 200", async () => {
    mockFetch.mockResolvedValue(makeResponse({ ok: true }));

    const result = await apiRequest<{ ok: boolean }>("/test");
    expect(result).toEqual({ ok: true });
  });

  it("sends Authorization header when token is set", async () => {
    setApiToken("my-jwt-token");
    mockFetch.mockResolvedValue(makeResponse({}));

    await apiRequest("/protected");

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(opts.headers).toMatchObject({
      Authorization: "Bearer my-jwt-token",
    });
  });

  it("does NOT send Authorization header when no token", async () => {
    mockFetch.mockResolvedValue(makeResponse({}));
    await apiRequest("/public");

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(opts.headers).not.toHaveProperty("Authorization");
  });

  it("calls onUnauthorized and throws on 401", async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    mockFetch.mockResolvedValue(makeResponse({ error: "Unauthorized" }, 401));

    await expect(apiRequest("/secret")).rejects.toThrow("Session expired");
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("throws on non-OK response", async () => {
    mockFetch.mockResolvedValue(makeResponse({ error: "Not found" }, 404));
    await expect(apiRequest("/missing")).rejects.toThrow();
  });

  it("returns null on 204 No Content", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.resolve(null),
      text: () => Promise.resolve(""),
    } as unknown as Response);

    const result = await apiRequest("/nothing");
    expect(result).toBeNull();
  });

  it("sends POST body and method", async () => {
    mockFetch.mockResolvedValue(makeResponse({ created: true }, 201));

    await apiRequest("/resource", {
      method: "POST",
      body: JSON.stringify({ name: "test" }),
    });

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(opts.method).toBe("POST");
    expect(opts.body).toBe(JSON.stringify({ name: "test" }));
    expect(opts.headers["Content-Type"]).toBe("application/json");
  });
});
