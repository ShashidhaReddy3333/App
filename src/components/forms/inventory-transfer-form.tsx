"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ApiClientError, applyFormIssues, requestJson } from "@/lib/client/api";
import { inventoryTransferSchema } from "@/lib/schemas/catalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";

type Values = z.infer<typeof inventoryTransferSchema>;

export function InventoryTransferForm({
  productOptions,
  locations,
  sourceLocationId,
}: {
  productOptions: Array<{ id: string; label: string }>;
  locations: Array<{ id: string; name: string }>;
  sourceLocationId: string;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const destinationOptions = useMemo(
    () => locations.filter((location) => location.id !== sourceLocationId),
    [locations, sourceLocationId]
  );

  const form = useForm<Values>({
    resolver: zodResolver(inventoryTransferSchema),
    defaultValues: {
      productId: productOptions[0]?.id ?? "",
      sourceLocationId,
      destinationLocationId: destinationOptions[0]?.id ?? "",
      quantity: 1,
      reason: "",
      idempotencyKey: crypto.randomUUID(),
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await requestJson<{ transfer: { id: string } }>("/api/inventory/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      toast.success("Inventory transferred.");
      form.reset({
        ...values,
        destinationLocationId: destinationOptions[0]?.id ?? "",
        quantity: 1,
        reason: "",
        idempotencyKey: crypto.randomUUID(),
      });
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) {
        applyFormIssues(form, error.issues);
        setServerError(error.message);
        toast.error(error.message);
        return;
      }

      setServerError("Unable to transfer inventory.");
      toast.error("Unable to transfer inventory.");
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer inventory</CardTitle>
        <CardDescription>
          Move on-hand stock from this location to another active store.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {destinationOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add another active location before using inventory transfers.
          </p>
        ) : (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <input type="hidden" {...form.register("sourceLocationId")} />
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="transfer-product">Product</Label>
              <Select id="transfer-product" {...form.register("productId")}>
                {productOptions.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-source">From</Label>
              <Input
                id="transfer-source"
                value={locations.find((location) => location.id === sourceLocationId)?.name ?? ""}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-destination">To</Label>
              <Select id="transfer-destination" {...form.register("destinationLocationId")}>
                {destinationOptions.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </Select>
              {form.formState.errors.destinationLocationId ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.destinationLocationId.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-quantity">Quantity</Label>
              <Input
                id="transfer-quantity"
                type="number"
                step="0.001"
                {...form.register("quantity", { valueAsNumber: true })}
              />
              {form.formState.errors.quantity ? (
                <p className="text-sm text-destructive">{form.formState.errors.quantity.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-reason">Reason</Label>
              <Input id="transfer-reason" {...form.register("reason")} />
              {form.formState.errors.reason ? (
                <p className="text-sm text-destructive">{form.formState.errors.reason.message}</p>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="transfer-key">Idempotency key</Label>
              <Input id="transfer-key" {...form.register("idempotencyKey")} />
            </div>
            {serverError ? (
              <p className="text-sm text-destructive md:col-span-2">{serverError}</p>
            ) : null}
            <div className="md:col-span-2">
              <Button className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Transferring..." : "Transfer stock"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
