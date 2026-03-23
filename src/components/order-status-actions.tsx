"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiClientError, requestJson } from "@/lib/client/api";
import { CancelOrderButton } from "@/components/cancel-order-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";

function toStatusLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function OrderStatusActions({
  orderId,
  nextStatuses,
  canCancel,
}: {
  orderId: string;
  nextStatuses: string[];
  canCancel?: boolean;
}) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function updateStatus(status: string) {
    setPendingStatus(status);
    try {
      await requestJson<{ order: { id: string; status: string } }>(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          note: note.trim() || undefined,
        }),
      });
      toast.success(`Order moved to ${toStatusLabel(status)}.`);
      setNote("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Unable to update order.");
    } finally {
      setPendingStatus(null);
    }
  }

  if (nextStatuses.length === 0 && !canCancel) {
    return null;
  }

  return (
    <div className="w-full space-y-3">
      {nextStatuses.length > 0 ? (
        <Input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional status note"
        />
      ) : null}
      <div className="flex flex-wrap items-center justify-end gap-3">
        {nextStatuses.map((status) => (
          <Button
            key={status}
            type="button"
            variant="secondary"
            disabled={pendingStatus !== null}
            onClick={() => void updateStatus(status)}
          >
            {pendingStatus === status ? "Updating..." : `Mark ${toStatusLabel(status)}`}
          </Button>
        ))}
        {canCancel ? <CancelOrderButton endpoint={`/api/orders/${orderId}/cancel`} /> : null}
      </div>
    </div>
  );
}
