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
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";

type Values = z.infer<typeof inventoryAdjustmentSchema>;

export function InventoryAdjustmentForm({
  locationId,
  products
}: {
  locationId: string;
  products: Array<{ id: string; name: string; label: string }>;
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
    <Card>
      <CardHeader>
        <CardTitle>Inventory adjustment</CardTitle>
        <CardDescription>Increase or decrease stock with an auditable reason and idempotency key.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <input type="hidden" {...form.register("locationId")} />
          <div className="space-y-2">
            <Label htmlFor="productId">Product</Label>
            <Select id="productId" {...form.register("productId")}>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.label}
                </option>
              ))}
            </Select>
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.productId ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.productId.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantityDelta">Quantity delta</Label>
            <Input id="quantityDelta" type="number" step="0.001" {...form.register("quantityDelta", { valueAsNumber: true })} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.quantityDelta ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.quantityDelta.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" {...form.register("reason")} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.reason ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.reason.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="idempotencyKey">Idempotency key</Label>
            <Input id="idempotencyKey" {...form.register("idempotencyKey")} />
          </div>
          {serverError ? <p className="text-sm text-destructive md:col-span-2" aria-live="polite" aria-atomic="true" role="alert">{serverError}</p> : null}
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
