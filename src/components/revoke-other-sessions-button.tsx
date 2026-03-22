"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiClientError, requestJson } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";

export function RevokeOtherSessionsButton({
  onRevoked,
}: {
  onRevoked?: (revokedSessionIds: string[]) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleRevoke() {
    setSubmitting(true);
    try {
      const result = await requestJson<{ revokedSessionIds: string[]; count: number }>(
        "/api/sessions/revoke-others",
        {
          method: "POST",
        }
      );
      toast.success(
        result.count > 0
          ? `Revoked ${result.count} other session${result.count === 1 ? "" : "s"}.`
          : "No other active sessions were found."
      );
      onRevoked?.(result.revokedSessionIds);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiClientError ? error.message : "Unable to revoke other sessions."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} disabled={submitting}>
        {submitting ? "Revoking..." : "Revoke all other sessions"}
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        title="Revoke your other sessions?"
        description="This signs out your account on every other device and keeps this current session active."
        confirmLabel={submitting ? "Revoking..." : "Revoke other sessions"}
        variant="destructive"
        onConfirm={handleRevoke}
      />
    </>
  );
}
