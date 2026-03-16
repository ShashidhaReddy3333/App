import { afterEach, describe, expect, it, vi } from "vitest";

import { assertInternalJobAuthorized } from "@/lib/internal-jobs";

describe("internal job authorization", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts bearer token authorization", () => {
    vi.stubEnv("CRON_SECRET", "1234567890abcdef");
    const request = new Request("https://app.example.com/api/internal/jobs/process-notifications", {
      headers: {
        Authorization: "Bearer 1234567890abcdef"
      }
    });

    expect(() => assertInternalJobAuthorized(request)).not.toThrow();
  });

  it("accepts x-cron-secret authorization", () => {
    vi.stubEnv("CRON_SECRET", "1234567890abcdef");
    const request = new Request("https://app.example.com/api/internal/jobs/process-notifications", {
      headers: {
        "x-cron-secret": "1234567890abcdef"
      }
    });

    expect(() => assertInternalJobAuthorized(request)).not.toThrow();
  });

  it("rejects invalid or missing secrets", () => {
    vi.stubEnv("CRON_SECRET", "1234567890abcdef");
    const request = new Request("https://app.example.com/api/internal/jobs/process-notifications");

    expect(() => assertInternalJobAuthorized(request)).toThrow("Invalid internal job authorization.");
  });
});
