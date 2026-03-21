"use client";

import { ErrorState } from "@/components/state-card";

export default function RootError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page-shell py-10">
      <ErrorState
        title="We couldn't load this page"
        description={error.message || "An unexpected error occurred while loading the application."}
        onRetryLabel="Reload page"
        onRetry={reset}
      />
    </main>
  );
}
