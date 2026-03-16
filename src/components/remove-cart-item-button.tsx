"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiClientError, requestJson } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
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
    <Button type="button" variant="ghost" onClick={removeItem} disabled={submitting}>
      {submitting ? "Removing..." : "Remove"}
    </Button>
  );
}
