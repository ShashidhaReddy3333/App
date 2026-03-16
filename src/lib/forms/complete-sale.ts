import { z } from "zod";

import { roundMoney } from "@/lib/money";
import { completeSaleSchema, paymentMethods, paymentProviders } from "@/lib/schemas/sales";

export const completeSaleDraftSchema = z.object({
  payments: z.array(
    z.object({
      method: z.enum(paymentMethods),
      amount: z.coerce.number().min(0),
      provider: z.enum(paymentProviders).optional(),
      externalReference: z.string().max(120).optional().or(z.literal(""))
    })
  ),
  idempotencyKey: z.string().min(8)
});

export type CompleteSaleDraftValues = z.infer<typeof completeSaleDraftSchema>;

export function createPaymentDraft(amount = 0) {
  return {
    method: "cash" as const,
    amount,
    provider: "manual" as const,
    externalReference: ""
  };
}

export function getPaymentTotal(payments: Array<{ amount: number }>) {
  return roundMoney(payments.reduce((sum, payment) => sum + (Number.isFinite(payment.amount) ? payment.amount : 0), 0));
}

export function buildCompleteSalePayload(values: CompleteSaleDraftValues, amountDue: number) {
  const payments = values.payments
    .map((payment) => ({
      method: payment.method,
      amount: Number(payment.amount),
      provider: payment.provider,
      externalReference: payment.externalReference?.trim() ?? ""
    }))
    .filter((payment) => Number.isFinite(payment.amount) && payment.amount > 0);

  if (payments.length === 0) {
    return {
      ok: false as const,
      message: "Add at least one payment amount greater than zero before completing the sale."
    };
  }

  const total = getPaymentTotal(payments);
  if (total < amountDue) {
    return {
      ok: false as const,
      message: `Collected payments must cover the total due of $${amountDue.toFixed(2)}.`
    };
  }

  return {
    ok: true as const,
    payload: completeSaleSchema.parse({
      payments,
      idempotencyKey: values.idempotencyKey
    }),
    total,
    changeGiven: roundMoney(Math.max(total - amountDue, 0))
  };
}
