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
import { paymentMethods, supportedPaymentProviders } from "@/lib/schemas/sales";
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
  const overpayment = Math.max(enteredTotal - amountDue, 0);

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
      <Card className="surface-shell overflow-hidden">
        <CardHeader className="space-y-4 border-b border-border/20 pb-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">Take payment</CardTitle>
              <CardDescription className="mt-1 max-w-xl text-sm leading-6">
                Record one or more payments, verify the collected total, and then complete the sale
                once.
              </CardDescription>
            </div>
            <div className="rounded-[24px] border border-primary/15 bg-primary/[0.06] px-4 py-3 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
              <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Amount due
              </div>
              <div className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                ${amountDue.toFixed(2)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-5 pt-6" onSubmit={onSubmit}>
            {payments.fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-[24px] border border-border/25 bg-[hsl(var(--surface-lowest))]/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">Payment {index + 1}</div>
                    <div className="text-xs text-muted-foreground">
                      Choose the method used at the register and enter the amount collected.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="min-h-11 px-4"
                    disabled={form.formState.isSubmitting || payments.fields.length === 1}
                    onClick={() => payments.remove(index)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="space-y-3">
                  <Label htmlFor={`payments.${index}.method`}>Method</Label>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {paymentMethods.map((method) => {
                      const isSelected = form.watch(`payments.${index}.method`) === method;
                      return (
                        <Button
                          key={method}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="lg"
                          className="min-h-11 justify-start rounded-[18px] px-4 text-left text-sm capitalize"
                          onClick={() =>
                            form.setValue(`payments.${index}.method`, method, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          {method.replaceAll("_", " ")}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="space-y-2">
                    <Label htmlFor={`payments.${index}.amount`}>Amount</Label>
                    <Input
                      id={`payments.${index}.amount`}
                      className="h-12 text-base"
                      type="number"
                      step="0.01"
                      {...form.register(`payments.${index}.amount`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`payments.${index}.provider`}>Provider</Label>
                    <Select
                      id={`payments.${index}.provider`}
                      className="h-12 text-base capitalize"
                      {...form.register(`payments.${index}.provider`)}
                    >
                      {supportedPaymentProviders.map((provider) => (
                        <option key={provider} value={provider}>
                          {provider}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded-[24px] border border-dashed border-border/40 bg-[hsl(var(--surface-lowest))]/92 p-5 text-sm text-muted-foreground">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[hsl(var(--surface-low))] px-4 py-3">
                  <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Entered total
                  </div>
                  <div className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                    ${enteredTotal.toFixed(2)}
                  </div>
                </div>
                <div className="rounded-2xl bg-[hsl(var(--surface-low))] px-4 py-3">
                  <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {remainingAmount > 0 ? "Remaining due" : "Change due"}
                  </div>
                  <div className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                    ${(remainingAmount > 0 ? remainingAmount : overpayment).toFixed(2)}
                  </div>
                </div>
                <div className="rounded-2xl bg-[hsl(var(--surface-low))] px-4 py-3">
                  <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Payment lines
                  </div>
                  <div className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                    {payments.fields.length}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="idempotencyKey">Idempotency key</Label>
              <Input
                id="idempotencyKey"
                className="h-12 text-base"
                {...form.register("idempotencyKey")}
              />
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
            <div className="sticky bottom-4 flex flex-col gap-3 rounded-[24px] border border-border/30 bg-[hsl(var(--surface-lowest))]/95 p-4 shadow-panel backdrop-blur-[14px] md:flex-row">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="min-h-11 md:flex-1"
                disabled={form.formState.isSubmitting}
                onClick={() => payments.append(createPaymentDraft(0))}
              >
                Add payment
              </Button>
              <Button
                size="lg"
                className="min-h-11 flex-1 text-base"
                disabled={form.formState.isSubmitting}
              >
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
