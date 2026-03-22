"use client";

import { ErrorState } from "@/components/state-card";

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page-shell py-10">
      <ErrorState
        title="We couldn't load this page"
        description="Something went wrong while loading this page. Please try again in a moment."
        onRetryLabel="Reload page"
        onRetry={reset}
      />
    </main>
  );
}
