import { afterEach, describe, expect, it, vi } from "vitest";

import { getSessionCookieDomain, shouldUseSecureSessionCookie } from "@/lib/auth/session-cookie";

describe("session cookie security", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses secure cookies in production regardless of APP_URL", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "http://localhost:3000");

    expect(shouldUseSecureSessionCookie()).toBe(true);
  });

  it("does not force secure cookies in development", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(shouldUseSecureSessionCookie()).toBe(false);
  });

  it("keeps the session cookie host-only across portals", () => {
    expect(getSessionCookieDomain()).toBeUndefined();
  });
});
