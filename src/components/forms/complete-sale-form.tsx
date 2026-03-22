"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";

import { requestJson } from "@/lib/client/api";
import {
  buildCompleteSalePayload,
  completeSaleDraftSchema,
  createPaymentDraft,
  getPaymentTotal,
  type CompleteSaleDraftValues,
} from "@/lib/forms/complete-sale";
import { paymentMethods, paymentProviders } from "@/lib/schemas/sales";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";

export function CompleteSaleForm({ saleId, amountDue }: { saleId: string; amountDue: number }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const form = useForm<CompleteSaleDraftValues>({
    defaultValues: {
      idempotencyKey: crypto.randomUUID(),
      payments: [createPaymentDraft(amountDue)],
    },
  });
  const payments = useFieldArray({
    control: form.control,
    name: "payments",
  });
  const watchedPayments = form.watch("payments");
  const enteredTotal = getPaymentTotal(watchedPayments ?? []);
  const remainingAmount = Math.max(amountDue - enteredTotal, 0);

  async function submitSale() {
    const values = form.getValues();
    setServerError(null);
    const parsed = completeSaleDraftSchema.safeParse(values);
    if (!parsed.success) {
      const firstFieldError =
        parsed.error.flatten().fieldErrors.payments?.[0] ??
        parsed.error.flatten().fieldErrors.idempotencyKey?.[0];
      setServerError(firstFieldError ?? "Review the payment details before completing the sale.");
      toast.error(firstFieldError ?? "Review the payment details before completing the sale.");
      return;
    }

    const result = buildCompleteSalePayload(parsed.data, amountDue);
    if (!result.ok) {
      setServerError(result.message);
      toast.error(result.message);
      return;
    }

    try {
      setConfirmOpen(false);
      const payload = await requestJson<{ sale: { id: string } }>(`/api/sales/${saleId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.payload),
      });
      toast.success("Sale completed.");
      router.push(`/app/sales/${payload.sale.id}`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to complete sale.";
      setServerError(message);
      toast.error(message);
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    const parsed = completeSaleDraftSchema.safeParse(values);
    if (!parsed.success) {
      const firstFieldError =
        parsed.error.flatten().fieldErrors.payments?.[0] ??
        parsed.error.flatten().fieldErrors.idempotencyKey?.[0];
      setServerError(firstFieldError ?? "Review the payment details before completing the sale.");
      toast.error(firstFieldError ?? "Review the payment details before completing the sale.");
      return;
    }

    const result = buildCompleteSalePayload(parsed.data, amountDue);
    if (!result.ok) {
      setServerError(result.message);
      toast.error(result.message);
      return;
    }

    setConfirmOpen(true);
  });

  return (
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <Card>
        <CardHeader>
          <CardTitle>Take payment</CardTitle>
          <CardDescription>
            Split payments are represented as multiple records on the sale.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            {payments.fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
              >
                <div className="space-y-2">
                  <Label htmlFor={`payments.${index}.method`}>Method</Label>
                  <Select
                    id={`payments.${index}.method`}
                    {...form.register(`payments.${index}.method`)}
                  >
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method.replaceAll("_", " ")}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`payments.${index}.amount`}>Amount</Label>
                  <Input
                    id={`payments.${index}.amount`}
                    type="number"
                    step="0.01"
                    {...form.register(`payments.${index}.amount`, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`payments.${index}.provider`}>Provider</Label>
                  <Select
                    id={`payments.${index}.provider`}
                    {...form.register(`payments.${index}.provider`)}
                  >
                    {paymentProviders.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={form.formState.isSubmitting || payments.fields.length === 1}
                    onClick={() => payments.remove(index)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Entered total</span>
                <span>${enteredTotal.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span>{remainingAmount > 0 ? "Remaining due" : "Change due"}</span>
                <span>
                  ${(remainingAmount > 0 ? remainingAmount : enteredTotal - amountDue).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="idempotencyKey">Idempotency key</Label>
              <Input id="idempotencyKey" {...form.register("idempotencyKey")} />
            </div>
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
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={form.formState.isSubmitting}
                onClick={() => payments.append(createPaymentDraft(0))}
              >
                Add payment
              </Button>
              <Button className="flex-1" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Completing..." : "Complete sale"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Complete sale</AlertDialogTitle>
          <AlertDialogDescription>
            Confirm this payment for ${amountDue.toFixed(2)}. This records a financial transaction
            and should only be submitted once.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={form.formState.isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void submitSale()}
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Completing..." : "Confirm sale"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
