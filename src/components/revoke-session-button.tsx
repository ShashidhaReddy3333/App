"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiClientError, requestJson } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { AlertDialog } from "@/components/ui/alert-dialog";

export function RevokeSessionButton({
  sessionId,
  onRevoked,
}: {
  sessionId: string;
  onRevoked?: (sessionId: string) => void;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleRevoke() {
    setIsSubmitting(true);
    try {
      await requestJson<{ session: { id: string } }>(`/api/sessions/${sessionId}/revoke`, {
        method: "POST",
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
  }

  return (
    <>
      <Button variant="outline" disabled={isSubmitting} onClick={() => setShowConfirm(true)}>
        {isSubmitting ? "Revoking..." : "Revoke"}
      </Button>
      <AlertDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Revoke Session?"
        description="This will immediately sign out this device. The user will need to sign in again."
        confirmLabel="Revoke Session"
        variant="destructive"
        onConfirm={handleRevoke}
      />
    </>
  );
}
