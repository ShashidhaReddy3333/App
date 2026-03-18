"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ApiClientError, applyFormIssues, requestJson } from "@/lib/client/api";
import { refundSchema } from "@/lib/schemas/sales";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { AlertDialog } from "@/components/ui/alert-dialog";

type Values = z.infer<typeof refundSchema>;

export function RefundForm({
  saleId,
  items,
}: {
  saleId: string;
  items: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      items: [
        {
          saleItemId: items[0]?.id ?? "",
          quantity: 1,
          restockAction: "restock_to_sellable",
        },
      ],
      reasonCode: "customer_returned",
      note: "",
      idempotencyKey: crypto.randomUUID(),
    },
  });

  async function submitRefund(values: Values) {
    setServerError(null);
    try {
      await requestJson<{ refund: { id: string } }>(`/api/sales/${saleId}/refunds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      toast.success("Refund created.");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) {
        applyFormIssues(form, error.issues);
        setServerError(error.message);
        toast.error(error.message);
        return;
      }
      setServerError("Unable to create refund.");
      toast.error("Unable to create refund.");
    }
  }

  const onSubmit = form.handleSubmit(async () => {
    setShowConfirm(true);
  });

  return (
    <Card className="gradient-panel">
      <CardHeader>
        <CardTitle>Create refund</CardTitle>
        <CardDescription>
          Refund one sale line at a time with explicit restock handling.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="saleItemId">Sale item</Label>
            <Input
              id="saleItemId"
              list="sale-item-options"
              {...form.register("items.0.saleItemId")}
            />
            <datalist id="sale-item-options">
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </datalist>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                {...form.register("items.0.quantity", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restockAction">Restock action</Label>
              <Input id="restockAction" {...form.register("items.0.restockAction")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reasonCode">Reason code</Label>
            <Input id="reasonCode" {...form.register("reasonCode")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Input id="note" {...form.register("note")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="idempotencyKey">Idempotency key</Label>
            <Input id="idempotencyKey" {...form.register("idempotencyKey")} />
          </div>
          {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
          <Button className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating..." : "Create refund"}
          </Button>
        </form>
        <AlertDialog
          open={showConfirm}
          onOpenChange={setShowConfirm}
          title="Process Refund?"
          description="This refund action cannot be undone."
          confirmLabel="Process Refund"
          variant="destructive"
          onConfirm={() => submitRefund(form.getValues())}
        />
      </CardContent>
    </Card>
  );
}
