"use client";

import { ErrorState } from "@/components/state-card";

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6">
      <ErrorState
        title="The admin portal hit an error"
        description={error.message || "We couldn't finish loading this admin page. Try again in a moment."}
        onRetryLabel="Retry admin page"
        onRetry={reset}
      />
    </div>
  );
}
