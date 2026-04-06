"use client";

import { ErrorState } from "@/components/state-card";

export default function CartError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page-shell py-10">
      <ErrorState
        title="Something went wrong"
        description="We couldn't load your cart. Please try again in a moment."
        onRetryLabel="Reload page"
        onRetry={reset}
      />
    </main>
  );
}
