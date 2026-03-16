import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { captureMonitoringMessage, getSentryEnvelopeUrlForTest } from "@/lib/monitoring/sentry";

describe("sentry monitoring helper", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "https://app.example.com");
    vi.stubEnv("SENTRY_DSN", "https://public@example.ingest.sentry.io/12345");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    process.env = { ...originalEnv };
  });

  it("builds the expected envelope URL from the DSN", () => {
    expect(getSentryEnvelopeUrlForTest("https://public@example.ingest.sentry.io/12345")).toBe(
      "https://example.ingest.sentry.io/api/12345/envelope/"
    );
  });

  it("posts monitoring envelopes to Sentry", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const eventId = await captureMonitoringMessage("manual_monitoring_test", { source: "unit-test" });

    expect(eventId).toMatch(/^[a-f0-9]{32}$/);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.ingest.sentry.io/api/12345/envelope/",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/x-sentry-envelope"
        }
      })
    );

    const request = fetchMock.mock.calls[0]?.[1];
    const envelope = String(request?.body);
    expect(envelope).toContain("\"dsn\":\"https://public@example.ingest.sentry.io/12345\"");
    expect(envelope).toContain("\"app_event\":\"manual_monitoring_test\"");
    expect(envelope).toContain("\"source\":\"unit-test\"");
  });
});
