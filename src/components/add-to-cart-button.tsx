"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiClientError, requestJson } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

export function AddToCartButton({
  productId,
  disabled,
  className
}: {
  productId: string;
  disabled?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function addToCart() {
    setSubmitting(true);
    try {
      await requestJson<{ cartId: string }>("/api/customer/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 })
      });
      toast.success("Added to cart.");
      router.refresh();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Unable to add product to cart.";
      toast.error(message);
      if (error instanceof ApiClientError && error.code === "UNAUTHORIZED") {
        window.location.assign("/customer/sign-up");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Button type="button" onClick={addToCart} disabled={disabled || submitting} className={className}>
      {submitting ? "Adding..." : "Add to cart"}
    </Button>
  );
}
