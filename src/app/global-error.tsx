"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void fetch("/api/internal/monitoring/client-error", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack ?? null,
        metadata: {
          source: "global-error",
          digest: error.digest ?? null
        }
      }),
      keepalive: true
    }).catch(() => null);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-white text-black">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">Application error</p>
            <h1 className="text-3xl font-bold text-black">Something went wrong.</h1>
            <p className="text-sm text-neutral-600">
              The error has been recorded. Retry this screen, and if the problem continues, use the support contact in the runbook.
            </p>
          </div>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
