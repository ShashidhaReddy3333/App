"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiClientError, requestJson } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

export function RevokeSessionButton({ sessionId, onRevoked }: { sessionId: string; onRevoked?: (sessionId: string) => void }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Button
      variant="outline"
      disabled={isSubmitting}
      onClick={async () => {
        setIsSubmitting(true);
        try {
          await requestJson<{ session: { id: string } }>(`/api/sessions/${sessionId}/revoke`, {
            method: "POST"
          });
          toast.success("Session revoked.");
          onRevoked?.(sessionId);
          router.refresh();
        } catch (error) {
          if (error instanceof ApiClientError) {
            toast.error(error.message);
          } else {
            toast.error("Unable to revoke session.");
          }
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      {isSubmitting ? "Revoking..." : "Revoke"}
    </Button>
  );
}
