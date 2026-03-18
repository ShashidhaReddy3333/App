"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";

import { ApiClientError, requestJson } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";

export function ReceivePurchaseOrderButton({
  purchaseOrderId,
  items
}: {
  purchaseOrderId: string;
  items: Array<{ itemId: string; remainingQuantity: number }>;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function receiveAll() {
    setSubmitting(true);
    try {
      await requestJson<{ purchaseOrder: { id: string } }>(`/api/procurement/purchase-orders/${purchaseOrderId}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            itemId: item.itemId,
            receivedQuantity: item.remainingQuantity
          })),
          idempotencyKey: uuid()
        })
      });
      toast.success("Goods received and inventory updated.");
      router.refresh();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Unable to receive purchase order.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="secondary" disabled={submitting || items.every((item) => item.remainingQuantity <= 0)}>
          {submitting ? "Receiving..." : "Receive remaining stock"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Receive Order</AlertDialogTitle>
          <AlertDialogDescription>Mark all items as received? This action cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => void receiveAll()} disabled={submitting}>
            {submitting ? "Receiving..." : "Confirm Receipt"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
