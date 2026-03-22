"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiClientError, requestJson } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

export function ReorderCreatePoButton({
  supplierId,
  supplierProductId,
  locationId,
  quantity,
}: {
  supplierId: string;
  supplierProductId: string;
  locationId: string;
  quantity: number;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    setSubmitting(true);
    try {
      await requestJson<{ purchaseOrder: { id: string } }>("/api/procurement/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          locationId,
          expectedDeliveryDate: "",
          items: [
            {
              supplierProductId,
              quantity,
            },
          ],
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      toast.success("Purchase order created.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiClientError ? error.message : "Unable to create purchase order."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Button type="button" variant="secondary" onClick={handleCreate} disabled={submitting}>
      {submitting ? "Creating..." : "Create PO"}
    </Button>
  );
}
