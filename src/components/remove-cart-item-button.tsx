"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export function RemoveCartItemButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function removeItem() {
    setSubmitting(true);
    try {
      await requestJson<{ cartId: string }>("/api/customer/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId })
      });
      toast.success("Item removed.");
      router.refresh();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Unable to remove cart item.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="ghost" disabled={submitting}>
          {submitting ? "Removing..." : "Remove"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Item</AlertDialogTitle>
          <AlertDialogDescription>Remove this item from your cart?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => void removeItem()} disabled={submitting}>
            {submitting ? "Removing..." : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
