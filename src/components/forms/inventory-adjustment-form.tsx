"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ApiClientError, applyFormIssues, requestJson } from "@/lib/client/api";
import { inventoryAdjustmentSchema } from "@/lib/schemas/catalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

type Values = z.infer<typeof inventoryAdjustmentSchema>;

export function InventoryAdjustmentForm({
  locationId,
  products
}: {
  locationId: string;
  products: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(inventoryAdjustmentSchema),
    defaultValues: {
      locationId,
      productId: products[0]?.id ?? "",
      quantityDelta: 0,
      reason: "",
      idempotencyKey: crypto.randomUUID()
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await requestJson<{ movement: { id: string } }>("/api/inventory/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      toast.success("Inventory adjusted.");
      form.reset({ ...values, quantityDelta: 0, reason: "", idempotencyKey: crypto.randomUUID() });
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) {
        applyFormIssues(form, error.issues);
        setServerError(error.message);
        toast.error(error.message);
        return;
      }
      setServerError("Unable to adjust stock.");
      toast.error("Unable to adjust stock.");
    }
  });

  return (
    <Card className="gradient-panel">
      <CardHeader>
        <CardTitle>Inventory adjustment</CardTitle>
        <CardDescription>Increase or decrease stock with an auditable reason and idempotency key.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <input type="hidden" {...form.register("locationId")} />
          <div className="space-y-2">
            <Label htmlFor="productId">Product ID</Label>
            <Input id="productId" list="product-options" {...form.register("productId")} />
            <datalist id="product-options">
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantityDelta">Quantity delta</Label>
            <Input id="quantityDelta" type="number" step="0.001" {...form.register("quantityDelta", { valueAsNumber: true })} />
            {form.formState.errors.quantityDelta ? <p className="text-sm text-destructive">{form.formState.errors.quantityDelta.message}</p> : null}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" {...form.register("reason")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="idempotencyKey">Idempotency key</Label>
            <Input id="idempotencyKey" {...form.register("idempotencyKey")} />
          </div>
          {serverError ? <p className="text-sm text-destructive md:col-span-2">{serverError}</p> : null}
          <div className="md:col-span-2">
            <Button className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Applying..." : "Apply adjustment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
