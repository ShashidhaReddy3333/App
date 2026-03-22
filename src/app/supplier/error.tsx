"use client";

import { ErrorState } from "@/components/state-card";

export default function SupplierError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-black px-6 py-4">
        <span className="text-lg font-bold tracking-tight text-white">Human Pulse</span>
      </div>
      <div className="page-shell py-8">
        <ErrorState
          title="The supplier portal hit an error"
          description={
            error.message || "We couldn't finish loading this supplier page. Please retry."
          }
          onRetryLabel="Retry supplier page"
          onRetry={reset}
        />
      </div>
    </main>
  );
}
