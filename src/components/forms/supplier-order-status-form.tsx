"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiClientError, requestJson } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";

const statuses = ["accepted", "rejected"] as const;

export function SupplierOrderStatusForm({
  purchaseOrderId,
  currentStatus
}: {
  purchaseOrderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await requestJson<{ purchaseOrder: { id: string } }>(`/api/supplier/orders/${purchaseOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      toast.success("Order status updated.");
      router.refresh();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Unable to update supplier order.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 md:flex-row">
      <Select value={status} onChange={(event) => setStatus(event.target.value)}>
        {statuses.map((entry) => (
          <option key={entry} value={entry}>
            {entry.replaceAll("_", " ")}
          </option>
        ))}
      </Select>
      <Button type="button" variant="secondary" onClick={submit} disabled={submitting}>
        {submitting ? "Updating..." : "Update"}
      </Button>
    </div>
  );
}
