"use client";

import { ErrorState } from "@/components/state-card";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="This business page failed to load"
      description="We couldn't finish loading this page right now. Please retry in a moment."
      onRetryLabel="Retry load"
      onRetry={reset}
    />
  );
}
