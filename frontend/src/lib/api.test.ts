import { describe, it, expect, vi, afterEach } from "vitest";
import { api, ApiError, monthRange } from "./api";
afterEach(() => vi.unstubAllGlobals());
describe("API boundaries", () => {
  it("gets CSRF before a mutation and sends same-origin credentials", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ headerName: "X-CSRF-TOKEN", token: "test-token" }),
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    await api("/bills/x", { method: "DELETE" });
    expect(fetch.mock.calls[1][1].headers.get("X-CSRF-TOKEN")).toBe(
      "test-token",
    );
    expect(fetch.mock.calls[1][1].credentials).toBe("same-origin");
  });
  it("preserves server validation details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "VALIDATION",
            message: "Check amount",
            fieldErrors: { amount: "Positive only" },
          }),
          { status: 422 },
        ),
      ),
    );
    await expect(api("/bills")).rejects.toMatchObject({
      status: 422,
      fieldErrors: { amount: "Positive only" },
    } satisfies Partial<ApiError>);
  });
  it("uses calendar days for leap February", () => {
    expect(monthRange("2024-02")).toEqual({
      from: "2024-02-01",
      to: "2024-02-29",
    });
  });
});
