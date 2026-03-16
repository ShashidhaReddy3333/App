import { captureServerException } from "@/lib/monitoring/sentry";

type LogLevel = "info" | "warn" | "error";

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return error;
}

export function getRequestContext(request?: Request) {
  return {
    requestId: request?.headers.get("x-request-id") ?? "unknown",
    ipAddress: request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request?.headers.get("user-agent") ?? null
  };
}

export function logEvent(level: LogLevel, event: string, metadata: Record<string, unknown> = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...metadata
  };
  const serialized = JSON.stringify(payload);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.info(serialized);
}

export function logError(event: string, error: unknown, metadata: Record<string, unknown> = {}) {
  logEvent("error", event, {
    ...metadata,
    error: serializeError(error)
  });
  void captureServerException(event, error, metadata);
}
