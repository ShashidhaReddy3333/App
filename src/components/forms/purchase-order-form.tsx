"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuid } from "uuid";

import { ApiClientError, applyFormIssues, requestJson } from "@/lib/client/api";
import { purchaseOrderSchema } from "@/lib/schemas/procurement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";

type Values = z.infer<typeof purchaseOrderSchema>;

export function PurchaseOrderForm({
  locationId,
  suppliers,
  supplierProducts
}: {
  locationId: string;
  suppliers: Array<{ id: string; name: string }>;
  supplierProducts: Array<{ id: string; supplierId: string; label: string }>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplierId: suppliers[0]?.id ?? "",
      locationId,
      expectedDeliveryDate: "",
      items: supplierProducts[0]
        ? [
            {
              supplierProductId: supplierProducts[0].id,
              quantity: 1
            }
          ]
        : [],
      idempotencyKey: uuid()
    }
  });

  const supplierId = form.watch("supplierId");
  const filteredProducts = useMemo(
    () => supplierProducts.filter((product) => product.supplierId === supplierId),
    [supplierId, supplierProducts]
  );

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await requestJson<{ purchaseOrder: { id: string } }>("/api/procurement/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      toast.success("Purchase order created.");
      form.reset({
        supplierId: values.supplierId,
        locationId,
        expectedDeliveryDate: "",
        items: filteredProducts[0]
          ? [
              {
                supplierProductId: filteredProducts[0].id,
                quantity: 1
              }
            ]
          : [],
        idempotencyKey: uuid()
      });
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) {
        applyFormIssues(form, error.issues);
        setServerError(error.message);
        toast.error(error.message);
        return;
      }
      setServerError("Unable to create purchase order.");
      toast.error("Unable to create purchase order.");
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create purchase order</CardTitle>
        <CardDescription>Compare supplier options and issue a new wholesale order for low-stock items.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="supplierId">Supplier</Label>
            <Select
              id="supplierId"
              {...form.register("supplierId", {
                onChange: (event) => {
                  const nextSupplierId = event.target.value;
                  const nextProducts = supplierProducts.filter((product) => product.supplierId === nextSupplierId);
                  form.setValue(
                    "items",
                    nextProducts[0]
                      ? [
                          {
                            supplierProductId: nextProducts[0].id,
                            quantity: 1
                          }
                        ]
                      : []
                  );
                }
              })}
            >
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </Select>
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.supplierId ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.supplierId.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="items.0.supplierProductId">Supplier product</Label>
            <Select id="items.0.supplierProductId" {...form.register("items.0.supplierProductId")}>
              {filteredProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.label}
                </option>
              ))}
            </Select>
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.items?.[0]?.supplierProductId ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.items[0].supplierProductId?.message}</p> : null}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="items.0.quantity">Quantity</Label>
              <Input id="items.0.quantity" type="number" step="1" {...form.register("items.0.quantity")} />
              <div aria-live="polite" aria-atomic="true">
                {form.formState.errors.items?.[0]?.quantity ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.items[0].quantity?.message}</p> : null}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedDeliveryDate">Expected delivery</Label>
              <Input id="expectedDeliveryDate" type="date" {...form.register("expectedDeliveryDate")} />
              <div aria-live="polite" aria-atomic="true">
                {form.formState.errors.expectedDeliveryDate ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.expectedDeliveryDate.message}</p> : null}
              </div>
            </div>
          </div>
          {serverError ? <p className="text-sm text-destructive" aria-live="polite" aria-atomic="true" role="alert">{serverError}</p> : null}
          <Button className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating..." : "Create purchase order"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
