"use client";

import { useEffect } from "react";

function postClientError(payload: { message: string; stack?: string | null; metadata?: Record<string, unknown> }) {
  void fetch("/api/internal/monitoring/client-error", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(() => {
    return null;
  });
}

export function MonitoringClient() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      postClientError({
        message: event.message || "Unhandled client error",
        stack: event.error instanceof Error ? event.error.stack ?? null : null,
        metadata: {
          source: "window.onerror",
          filename: event.filename,
          line: event.lineno,
          column: event.colno
        }
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      postClientError({
        message: reason instanceof Error ? reason.message : "Unhandled promise rejection",
        stack: reason instanceof Error ? reason.stack ?? null : null,
        metadata: {
          source: "window.onunhandledrejection",
          reason: reason instanceof Error ? undefined : String(reason)
        }
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
