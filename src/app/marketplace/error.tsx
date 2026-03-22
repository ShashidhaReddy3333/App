"use client";

import { ErrorState } from "@/components/state-card";

export default function MarketplaceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/10 to-primary/5 px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <ErrorState
            title="The marketplace page failed to load"
            description="Please try again. If the issue persists, return to the marketplace home page and reload."
            onRetryLabel="Retry marketplace page"
            onRetry={reset}
          />
        </div>
      </section>
    </main>
  );
}
