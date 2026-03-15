"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ApiClientError, applyFormIssues, requestJson } from "@/lib/client/api";
import { completeSaleSchema } from "@/lib/schemas/sales";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

type Values = z.infer<typeof completeSaleSchema>;

export function CompleteSaleForm({ saleId, amountDue }: { saleId: string; amountDue: number }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(completeSaleSchema),
    defaultValues: {
      idempotencyKey: crypto.randomUUID(),
      payments: [
        {
          method: "cash",
          amount: amountDue,
          provider: "manual",
          externalReference: ""
        }
      ]
    }
  });
  const payments = useFieldArray({
    control: form.control,
    name: "payments"
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const payload = await requestJson<{ sale: { id: string } }>(`/api/sales/${saleId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      toast.success("Sale completed.");
      router.push(`/app/sales/${payload.sale.id}`);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) {
        applyFormIssues(form, error.issues);
        setServerError(error.message);
        toast.error(error.message);
        return;
      }
      setServerError("Unable to complete sale.");
      toast.error("Unable to complete sale.");
    }
  });

  return (
    <Card className="gradient-panel">
      <CardHeader>
        <CardTitle>Take payment</CardTitle>
        <CardDescription>Split payments are represented as multiple records on the sale.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          {payments.fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 rounded-2xl border p-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor={`payments.${index}.method`}>Method</Label>
                <Input id={`payments.${index}.method`} {...form.register(`payments.${index}.method`)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`payments.${index}.amount`}>Amount</Label>
                <Input id={`payments.${index}.amount`} type="number" step="0.01" {...form.register(`payments.${index}.amount`, { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`payments.${index}.provider`}>Provider</Label>
                <Input id={`payments.${index}.provider`} {...form.register(`payments.${index}.provider`)} />
              </div>
            </div>
          ))}
          <div className="space-y-2">
            <Label htmlFor="idempotencyKey">Idempotency key</Label>
            <Input id="idempotencyKey" {...form.register("idempotencyKey")} />
          </div>
          {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={form.formState.isSubmitting}
              onClick={() => payments.append({ method: "credit_card", amount: 0, provider: "manual", externalReference: "" })}
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
  );
}
