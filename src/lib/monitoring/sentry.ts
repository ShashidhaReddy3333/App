import { randomUUID } from "node:crypto";

import { env, getOptionalSentryDsn } from "@/lib/env";

const REPORTED_ERROR_SYMBOL = Symbol.for("bma.sentryReported");

type ParsedSentryDsn = {
  envelopeUrl: string;
  dsn: string;
};

type CaptureInput = {
  event: string;
  error?: unknown;
  level?: "error" | "warning" | "info";
  metadata?: Record<string, unknown>;
  tags?: Record<string, string>;
};

function parseSentryDsn(value: string): ParsedSentryDsn {
  const url = new URL(value);
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const projectId = pathSegments.pop();
  const pathPrefix = pathSegments.length > 0 ? `/${pathSegments.join("/")}` : "";

  if (!projectId) {
    throw new Error("SENTRY_DSN must include a project id.");
  }

  return {
    dsn: value,
    envelopeUrl: `${url.protocol}//${url.host}${pathPrefix}/api/${projectId}/envelope/`
  };
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      type: error.name,
      value: error.message,
      stacktrace: error.stack
        ? {
            frames: error.stack.split("\n").map((line) => ({
              filename: line.trim()
            }))
          }
        : undefined
    };
  }

  let value = "Unknown error";
  if (typeof error === "string") {
    value = error;
  } else if (typeof error !== "undefined") {
    try {
      value = JSON.stringify(error);
    } catch {
      value = String(error);
    }
  }

  return {
    type: "Error",
    value
  };
}

function normalizeExtra(metadata?: Record<string, unknown>) {
  if (!metadata) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      value instanceof Error
        ? {
            name: value.name,
            message: value.message,
            stack: value.stack
          }
        : value
    ])
  );
}

async function sendEnvelope(payload: Record<string, unknown>) {
  const dsn = getOptionalSentryDsn();
  if (!dsn) {
    return false;
  }

  const parsed = parseSentryDsn(dsn);
  const envelope = [
    JSON.stringify({
      event_id: payload.event_id,
      sent_at: new Date().toISOString(),
      dsn: parsed.dsn
    }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(payload)
  ].join("\n");

  await fetch(parsed.envelopeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-sentry-envelope"
    },
    body: envelope
  });

  return true;
}

export function markErrorReported(error: unknown) {
  if (typeof error === "object" && error !== null) {
    Object.defineProperty(error, REPORTED_ERROR_SYMBOL, {
      configurable: true,
      enumerable: false,
      writable: true,
      value: true
    });
  }
}

export function wasErrorReported(error: unknown) {
  return typeof error === "object" && error !== null && REPORTED_ERROR_SYMBOL in error;
}

export async function captureMonitoringEvent(input: CaptureInput) {
  const eventId = randomUUID().replace(/-/g, "");
  const payload: Record<string, unknown> = {
    event_id: eventId,
    timestamp: new Date().toISOString(),
    level: input.level ?? "error",
    platform: "javascript",
    environment: env.NODE_ENV,
    server_name: new URL(env.APP_URL).host,
    tags: {
      ...input.tags,
      app_event: input.event
    },
    extra: normalizeExtra(input.metadata)
  };

  if (input.error) {
    payload.exception = {
      values: [serializeError(input.error)]
    };
  } else {
    payload.message = {
      formatted: input.event
    };
  }

  try {
    await sendEnvelope(payload);
  } catch {
    return null;
  }

  return eventId;
}

export async function captureServerException(event: string, error: unknown, metadata?: Record<string, unknown>) {
  if (wasErrorReported(error)) {
    return null;
  }

  const eventId = await captureMonitoringEvent({
    event,
    error,
    metadata,
    tags: {
      runtime: "server"
    }
  });
  markErrorReported(error);
  return eventId;
}

export async function captureClientException(input: {
  message: string;
  stack?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const syntheticError = new Error(input.message);
  if (input.stack) {
    syntheticError.stack = input.stack;
  }

  return captureMonitoringEvent({
    event: "client_runtime_error",
    error: syntheticError,
    metadata: input.metadata,
    tags: {
      runtime: "client"
    }
  });
}

export async function captureMonitoringMessage(event: string, metadata?: Record<string, unknown>) {
  return captureMonitoringEvent({
    event,
    level: "info",
    metadata,
    tags: {
      runtime: "server"
    }
  });
}

export function getSentryEnvelopeUrlForTest(dsn: string) {
  return parseSentryDsn(dsn).envelopeUrl;
}
