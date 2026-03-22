"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiClientError, requestJson } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";

export function SupplierOrderStatusForm({
  purchaseOrderId,
  currentStatus,
}: {
  purchaseOrderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const nextStatuses =
    currentStatus === "sent"
      ? (["accepted", "rejected"] as const)
      : currentStatus === "accepted"
        ? (["shipped"] as const)
        : ([] as const);
  const [status, setStatus] = useState<string>(nextStatuses[0] ?? currentStatus);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (status === "shipped" && !trackingNumber.trim()) {
      toast.error("Tracking number is required when marking an order as shipped.");
      return;
    }

    setSubmitting(true);
    try {
      await requestJson<{ purchaseOrder: { id: string } }>(
        `/api/supplier/orders/${purchaseOrderId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, trackingNumber }),
        }
      );
      toast.success("Order status updated.");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : "Unable to update supplier order.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (nextStatuses.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 md:flex-row">
      <Select value={status} onChange={(event) => setStatus(event.target.value)}>
        {nextStatuses.map((entry) => (
          <option key={entry} value={entry}>
            {entry.replaceAll("_", " ")}
          </option>
        ))}
      </Select>
      {status === "shipped" ? (
        <Input
          placeholder="Tracking number"
          value={trackingNumber}
          onChange={(event) => setTrackingNumber(event.target.value)}
        />
      ) : null}
      <Button type="button" variant="secondary" onClick={submit} disabled={submitting}>
        {submitting ? "Updating..." : "Update"}
      </Button>
    </div>
  );
}
