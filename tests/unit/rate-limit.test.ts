import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { withRateLimit } from "@/lib/api-rate-limit";
import { _resetStoreForTesting, rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    _resetStoreForTesting();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit", () => {
    for (let i = 0; i < 5; i++) {
      const result = rateLimit("user1", { limit: 5, windowMs: 60_000 });
      expect(result.success).toBe(true);
    }
  });

  it("blocks the request that exceeds the limit", () => {
    for (let i = 0; i < 5; i++) {
      rateLimit("user1", { limit: 5, windowMs: 60_000 });
    }
    const result = rateLimit("user1", { limit: 5, windowMs: 60_000 });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("decrements remaining on each allowed request", () => {
    const r1 = rateLimit("user1", { limit: 5, windowMs: 60_000 });
    expect(r1.remaining).toBe(4);
    const r2 = rateLimit("user1", { limit: 5, windowMs: 60_000 });
    expect(r2.remaining).toBe(3);
  });

  it("isolates different identifiers", () => {
    for (let i = 0; i < 5; i++) {
      rateLimit("user1", { limit: 5, windowMs: 60_000 });
    }
    const result = rateLimit("user2", { limit: 5, windowMs: 60_000 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("allows requests again after the window expires (sliding window)", () => {
    vi.setSystemTime(0);
    for (let i = 0; i < 5; i++) {
      rateLimit("user1", { limit: 5, windowMs: 60_000 });
    }
    // Advance past the window — all previous timestamps are now expired
    vi.setSystemTime(61_000);
    const result = rateLimit("user1", { limit: 5, windowMs: 60_000 });
    expect(result.success).toBe(true);
  });

  it("only counts requests within the sliding window", () => {
    vi.setSystemTime(0);
    // Use 3 of 5 slots
    for (let i = 0; i < 3; i++) {
      rateLimit("user1", { limit: 5, windowMs: 60_000 });
    }
    // Advance past window — those 3 requests expire
    vi.setSystemTime(61_000);
    // Now use 4 more — should all succeed (window is fresh)
    for (let i = 0; i < 4; i++) {
      const result = rateLimit("user1", { limit: 5, windowMs: 60_000 });
      expect(result.success).toBe(true);
    }
    // 5th in this new window still ok
    expect(rateLimit("user1", { limit: 5, windowMs: 60_000 }).success).toBe(true);
    // 6th is blocked
    expect(rateLimit("user1", { limit: 5, windowMs: 60_000 }).success).toBe(false);
  });

  it("returns a resetAt in the future", () => {
    vi.setSystemTime(0);
    const result = rateLimit("user1", { limit: 5, windowMs: 60_000 });
    expect(result.resetAt.getTime()).toBe(60_000);
  });

  it("resetAt reflects the oldest in-window timestamp", () => {
    vi.setSystemTime(0);
    rateLimit("user1", { limit: 5, windowMs: 60_000 });
    vi.setSystemTime(10_000);
    rateLimit("user1", { limit: 5, windowMs: 60_000 });
    // oldest is at t=0, so resetAt = 0 + 60_000
    const result = rateLimit("user1", { limit: 5, windowMs: 60_000 });
    expect(result.resetAt.getTime()).toBe(60_000);
  });
});

describe("withRateLimit", () => {
  beforeEach(() => {
    _resetStoreForTesting();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function makeRequest(options: { method?: string; ip?: string; url?: string } = {}): Request {
    return new Request(options.url ?? "http://localhost/api/test", {
      method: options.method ?? "POST",
      headers: options.ip ? { "x-forwarded-for": options.ip } : {},
    });
  }

  it("calls through to the handler when under the limit", async () => {
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const wrapped = withRateLimit(handler, { limit: 5, windowMs: 60_000 });

    const response = await wrapped(makeRequest({ ip: "1.2.3.4" }));
    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("returns 429 when the limit is exceeded", async () => {
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const wrapped = withRateLimit(handler, { limit: 2, windowMs: 60_000 });

    await wrapped(makeRequest({ ip: "1.2.3.4" }));
    await wrapped(makeRequest({ ip: "1.2.3.4" }));
    const response = await wrapped(makeRequest({ ip: "1.2.3.4" }));

    expect(response.status).toBe(429);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("includes Retry-After and rate limit headers on 429", async () => {
    vi.setSystemTime(0);
    const wrapped = withRateLimit(vi.fn().mockResolvedValue(new Response("ok")), {
      limit: 1,
      windowMs: 60_000,
    });

    await wrapped(makeRequest({ ip: "5.5.5.5" }));
    const response = await wrapped(makeRequest({ ip: "5.5.5.5" }));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(response.headers.get("X-RateLimit-Limit")).toBe("1");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(response.headers.get("X-RateLimit-Reset")).toBeTruthy();
  });

  it("returns a JSON body on 429", async () => {
    const wrapped = withRateLimit(vi.fn().mockResolvedValue(new Response("ok")), {
      limit: 1,
      windowMs: 60_000,
    });
    await wrapped(makeRequest({ ip: "9.9.9.9" }));
    const response = await wrapped(makeRequest({ ip: "9.9.9.9" }));
    const body = await response.json();
    expect(body.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(body.message).toBeTruthy();
  });

  it("isolates different IPs", async () => {
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const wrapped = withRateLimit(handler, { limit: 1, windowMs: 60_000 });

    await wrapped(makeRequest({ ip: "1.1.1.1" }));
    const response = await wrapped(makeRequest({ ip: "2.2.2.2" }));
    expect(response.status).toBe(200);
  });

  it("falls back to 'unknown' when x-forwarded-for is absent", async () => {
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const wrapped = withRateLimit(handler, { limit: 1, windowMs: 60_000 });

    const response = await wrapped(makeRequest()); // no ip
    expect(response.status).toBe(200);
  });

  it("uses first IP from x-forwarded-for chain", async () => {
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const wrapped = withRateLimit(handler, { limit: 1, windowMs: 60_000 });

    // First call with chained IPs
    await wrapped(makeRequest({ ip: "10.0.0.1, 10.0.0.2" }));
    // Second call with only the first IP — should be blocked (same identifier)
    const response = await wrapped(makeRequest({ ip: "10.0.0.1" }));
    expect(response.status).toBe(429);
  });

  it("passes context arguments through to the handler", async () => {
    type Ctx = { params: Promise<{ id: string }> };
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const wrapped = withRateLimit<[Ctx]>(handler, { limit: 5, windowMs: 60_000 });

    const ctx: Ctx = { params: Promise.resolve({ id: "abc" }) };
    await wrapped(makeRequest(), ctx);
    expect(handler).toHaveBeenCalledWith(expect.any(Request), ctx);
  });
});
