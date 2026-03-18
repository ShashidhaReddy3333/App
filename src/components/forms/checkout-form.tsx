"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ApiClientError, applyFormIssues, requestJson } from "@/lib/client/api";
import { checkoutSchema } from "@/lib/schemas/sales";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";

type Values = z.infer<typeof checkoutSchema>;

export function CheckoutForm({
  locationId,
  products
}: {
  locationId: string;
  products: Array<{ id: string; name: string; label: string; sellingPrice: number }>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      locationId,
      items: [
        {
          productId: products[0]?.id ?? "",
          quantity: 1,
          unitPrice: products[0]?.sellingPrice ?? 0
        }
      ]
    }
  });
  const items = useFieldArray({
    control: form.control,
    name: "items"
  });

  const updateProduct = (index: number, productId: string) => {
    const product = products.find((entry) => entry.id === productId);
    form.setValue(`items.${index}.productId`, productId, { shouldDirty: true, shouldValidate: true });
    if (product) {
      form.setValue(`items.${index}.unitPrice`, product.sellingPrice, { shouldDirty: true, shouldValidate: true });
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const payload = await requestJson<{ sale: { id: string } }>("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      toast.success("Cart reserved and ready for payment.");
      router.push(`/app/checkout?saleId=${payload.sale.id}`);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) {
        applyFormIssues(form, error.issues);
        setServerError(error.message);
        toast.error(error.message);
        return;
      }
      setServerError("Unable to create checkout.");
      toast.error("Unable to create checkout.");
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>New checkout</CardTitle>
        <CardDescription>Create a pending-payment cart and reserve stock before payment collection.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input type="hidden" {...form.register("locationId")} />
          {items.fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor={`items.${index}.productId`}>Product</Label>
                <Select
                  id={`items.${index}.productId`}
                  value={form.watch(`items.${index}.productId`)}
                  onChange={(event) => updateProduct(index, event.target.value)}
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`items.${index}.quantity`}>Qty</Label>
                <Input id={`items.${index}.quantity`} type="number" step="0.001" {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`items.${index}.unitPrice`}>Unit price</Label>
                <Input id={`items.${index}.unitPrice`} type="number" step="0.01" {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })} />
              </div>
            </div>
          ))}
          {serverError ? <p className="text-sm text-destructive" aria-live="polite" aria-atomic="true" role="alert">{serverError}</p> : null}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={form.formState.isSubmitting}
              onClick={() => items.append({ productId: products[0]?.id ?? "", quantity: 1, unitPrice: products[0]?.sellingPrice ?? 0 })}
            >
              Add item
            </Button>
            <Button className="flex-1" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Reserving..." : "Reserve cart"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
