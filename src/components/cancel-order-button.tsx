"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiClientError, requestJson } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";

export function CancelOrderButton({
  endpoint,
  label = "Cancel order",
  onCancelled,
}: {
  endpoint: string;
  label?: string;
  onCancelled?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleCancel() {
    setSubmitting(true);
    try {
      await requestJson<{ order: { id: string; status: string } }>(endpoint, {
        method: "POST",
      });
      toast.success("Order cancelled.");
      setOpen(false);
      onCancelled?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Unable to cancel order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} disabled={submitting}>
        {submitting ? "Cancelling..." : label}
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        title="Cancel order?"
        description="This will void the order before fulfillment starts and restock the reserved inventory."
        confirmLabel={submitting ? "Cancelling..." : "Cancel order"}
        variant="destructive"
        onConfirm={handleCancel}
      />
    </>
  );
}
