import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { withRateLimit } from "@/lib/api-rate-limit";
import { _resetStoreForTesting, getRateLimitIdentifier, rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    _resetStoreForTesting();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit", () => {
    for (let index = 0; index < 5; index++) {
      const result = rateLimit("user1", { limit: 5, windowMs: 60_000 });
      expect(result.success).toBe(true);
    }
  });

  it("blocks the request that exceeds the limit", () => {
    for (let index = 0; index < 5; index++) {
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
    for (let index = 0; index < 5; index++) {
      rateLimit("user1", { limit: 5, windowMs: 60_000 });
    }

    const result = rateLimit("user2", { limit: 5, windowMs: 60_000 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("allows requests again after the window expires", () => {
    vi.setSystemTime(0);
    for (let index = 0; index < 5; index++) {
      rateLimit("user1", { limit: 5, windowMs: 60_000 });
    }

    vi.setSystemTime(61_000);
    const result = rateLimit("user1", { limit: 5, windowMs: 60_000 });
    expect(result.success).toBe(true);
  });

  it("returns a resetAt in the future", () => {
    vi.setSystemTime(0);
    const result = rateLimit("user1", { limit: 5, windowMs: 60_000 });
    expect(result.resetAt.getTime()).toBe(60_000);
  });
});

describe("getRateLimitIdentifier", () => {
  it("extracts the first IP from x-forwarded-for", () => {
    const request = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
    });
    expect(getRateLimitIdentifier(request)).toBe("192.168.1.1");
  });

  it("returns unknown when forwarding headers are missing", () => {
    const request = new Request("http://localhost/api/test");
    expect(getRateLimitIdentifier(request)).toBe("unknown");
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

  it("includes retry headers on 429", async () => {
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
});
