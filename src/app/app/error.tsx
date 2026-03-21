"use client";

import { ErrorState } from "@/components/state-card";

export default function AppError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="This business page failed to load"
      description={error.message || "Please try again. If the issue persists, verify that the demo data has been seeded and your session is still active."}
      onRetryLabel="Retry load"
      onRetry={reset}
    />
  );
}
