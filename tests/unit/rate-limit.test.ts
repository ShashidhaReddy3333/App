import { describe, expect, it, vi, beforeEach } from "vitest";

import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    // Use unique keys per test to avoid cross-test pollution
    vi.restoreAllMocks();
  });

  it("allows requests under the limit", () => {
    const key = `test-under-limit-${Date.now()}`;
    const opts = { limit: 5, windowMs: 60_000 };

    const r1 = rateLimit(key, opts);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(4);

    const r2 = rateLimit(key, opts);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(3);
  });

  it("rejects requests over the limit", () => {
    const key = `test-over-limit-${Date.now()}`;
    const opts = { limit: 3, windowMs: 60_000 };

    rateLimit(key, opts);
    rateLimit(key, opts);
    rateLimit(key, opts);

    const r4 = rateLimit(key, opts);
    expect(r4.success).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it("allows the exact number of requests at the limit", () => {
    const key = `test-exact-limit-${Date.now()}`;
    const opts = { limit: 2, windowMs: 60_000 };

    const r1 = rateLimit(key, opts);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(1);

    const r2 = rateLimit(key, opts);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(0);

    const r3 = rateLimit(key, opts);
    expect(r3.success).toBe(false);
  });

  it("resets after window expires", () => {
    const key = `test-window-reset-${Date.now()}`;
    const opts = { limit: 1, windowMs: 100 };

    const r1 = rateLimit(key, opts);
    expect(r1.success).toBe(true);

    const r2 = rateLimit(key, opts);
    expect(r2.success).toBe(false);

    // Simulate time passing beyond the window by manipulating Date.now
    const original = Date.now;
    vi.spyOn(Date, "now").mockReturnValue(original() + 200);

    const r3 = rateLimit(key, opts);
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);

    vi.restoreAllMocks();
  });

  it("returns a resetAt Date in the future", () => {
    const key = `test-reset-date-${Date.now()}`;
    const before = Date.now();
    const result = rateLimit(key, { limit: 10, windowMs: 30_000 });

    expect(result.resetAt).toBeInstanceOf(Date);
    expect(result.resetAt.getTime()).toBeGreaterThanOrEqual(before);
  });
});

describe("getRateLimitIdentifier", () => {
  it("extracts the first IP from x-forwarded-for", () => {
    const request = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
    });
    expect(getRateLimitIdentifier(request)).toBe("192.168.1.1");
  });

  it("returns 'unknown' when x-forwarded-for is missing", () => {
    const request = new Request("http://localhost/api/test");
    expect(getRateLimitIdentifier(request)).toBe("unknown");
  });
});
