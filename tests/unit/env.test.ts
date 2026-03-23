import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getRuntimeCheckIssues } from "@/lib/env";

describe("runtime environment checks", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      DEMO_MODE: "true",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/app?schema=public",
      DIRECT_URL: "postgresql://postgres:postgres@localhost:5432/app?schema=public",
      SESSION_SECRET: "12345678901234567890123456789012",
      APP_URL: "https://human-pulse.com",
      CRON_SECRET: "1234567890123456",
      STRIPE_SECRET_KEY: "1234567890123456",
      STRIPE_WEBHOOK_SECRET: "1234567890123456",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "1234567890123456",
      SENTRY_DSN: "https://example.com/123",
    };

    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("flags missing Upstash Redis configuration as an error in production", () => {
    const issues = getRuntimeCheckIssues();

    expect(issues).toContainEqual(
      expect.objectContaining({
        key: "UPSTASH_REDIS_REST_URL",
        severity: "error",
      })
    );
  });

  it("clears the Redis error when both Upstash values are configured", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "1234567890123456";

    const issues = getRuntimeCheckIssues();

    expect(
      issues.some(
        (issue) =>
          issue.key === "UPSTASH_REDIS_REST_URL" && issue.message.includes("required in production")
      )
    ).toBe(false);
  });
});
