"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ApiClientError, applyFormIssues, requestJson } from "@/lib/client/api";
import { useKeyboardShortcut } from "@/lib/hooks/use-keyboard-shortcut";
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
  products,
}: {
  locationId: string;
  products: Array<{ id: string; name: string; label: string; sellingPrice: number }>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const firstProductRef = useRef<HTMLSelectElement>(null);
  const form = useForm<Values>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      locationId,
      items: [
        {
          productId: products[0]?.id ?? "",
          quantity: 1,
          unitPrice: products[0]?.sellingPrice ?? 0,
        },
      ],
    },
  });
  const items = useFieldArray({
    control: form.control,
    name: "items",
  });
  const watchedItems = form.watch("items");
  const estimatedTotal = (watchedItems ?? []).reduce((sum, item) => {
    const quantity = Number.isFinite(item?.quantity) ? Number(item.quantity) : 0;
    const unitPrice = Number.isFinite(item?.unitPrice) ? Number(item.unitPrice) : 0;
    return sum + quantity * unitPrice;
  }, 0);

  const updateProduct = (index: number, productId: string) => {
    const product = products.find((entry) => entry.id === productId);
    form.setValue(`items.${index}.productId`, productId, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (product) {
      form.setValue(`items.${index}.unitPrice`, product.sellingPrice, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcut("Escape", () => {
    form.reset();
    setServerError(null);
    toast.info("Checkout form cleared.");
  });

  useKeyboardShortcut("F1", () => {
    firstProductRef.current?.focus();
  });

  useKeyboardShortcut("F2", () => {
    items.append({
      productId: products[0]?.id ?? "",
      quantity: 1,
      unitPrice: products[0]?.sellingPrice ?? 0,
    });
  });

  useKeyboardShortcut(
    "Enter",
    () => {
      form.handleSubmit((values) => onSubmitHandler(values))();
    },
    { ctrl: true }
  );

  const onSubmitHandler = async (values: Values) => {
    setServerError(null);
    try {
      const payload = await requestJson<{ sale: { id: string } }>("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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
  };

  const onSubmit = form.handleSubmit(onSubmitHandler);

  return (
    <Card className="surface-shell overflow-hidden">
      <CardHeader className="space-y-4 border-b border-border/20 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-2xl">New checkout</CardTitle>
            <CardDescription className="mt-1 max-w-xl text-sm leading-6">
              Build the cart on the left, reserve stock, then move straight into payment collection.
            </CardDescription>
          </div>
          <div className="rounded-2xl border border-border/30 bg-[hsl(var(--surface-lowest))]/90 px-4 py-3 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
            <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Draft total
            </div>
            <div className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground">
              ${estimatedTotal.toFixed(2)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5 pt-6" onSubmit={onSubmit}>
          <input type="hidden" {...form.register("locationId")} />
          {items.fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-border/25 bg-[hsl(var(--surface-lowest))]/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] md:col-span-3">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      Line item {index + 1}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Tap to adjust quantity or override unit price before reserving.
                    </div>
                  </div>
                  {items.fields.length > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="min-h-11 px-4"
                      disabled={form.formState.isSubmitting}
                      onClick={() => items.remove(index)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-4 lg:grid-cols-[1.35fr_0.7fr_0.8fr]">
                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.productId`}>Product</Label>
                    <Select
                      ref={index === 0 ? firstProductRef : undefined}
                      id={`items.${index}.productId`}
                      className="h-12 text-base"
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
                    <Input
                      id={`items.${index}.quantity`}
                      className="h-12 text-base"
                      type="number"
                      step="0.001"
                      {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.unitPrice`}>Unit price</Label>
                    <Input
                      id={`items.${index}.unitPrice`}
                      className="h-12 text-base"
                      type="number"
                      step="0.01"
                      {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {serverError ? (
            <p
              className="text-sm text-destructive"
              aria-live="polite"
              aria-atomic="true"
              role="alert"
            >
              {serverError}
            </p>
          ) : null}
          <div className="sticky bottom-4 flex flex-col gap-3 rounded-[24px] border border-border/30 bg-[hsl(var(--surface-lowest))]/95 p-4 shadow-panel backdrop-blur-[14px] md:flex-row">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="min-h-11 md:flex-1"
              disabled={form.formState.isSubmitting}
              onClick={() =>
                items.append({
                  productId: products[0]?.id ?? "",
                  quantity: 1,
                  unitPrice: products[0]?.sellingPrice ?? 0,
                })
              }
            >
              Add item
            </Button>
            <Button
              size="lg"
              className="min-h-11 flex-1 text-base"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Reserving..." : "Reserve cart"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
