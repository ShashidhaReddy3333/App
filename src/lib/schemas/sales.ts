import { z } from "zod";

export const paymentMethods = ["cash", "debit_card", "credit_card", "mobile_payment", "bank_transfer", "gift_card", "store_credit"] as const;
export const paymentProviders = ["stripe", "square", "manual"] as const;
export const restockActions = ["restock_to_sellable", "restock_to_damaged", "do_not_restock"] as const;

const discountSchema = z.object({
  type: z.enum(["fixed_amount", "percentage"]),
  value: z.coerce.number().min(0),
  scope: z.enum(["line_item", "sale"]),
  reason: z.string().min(1).max(120)
});

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
  discount: discountSchema.optional()
});

export const checkoutSchema = z.object({
  locationId: z.string().min(1),
  items: z.array(checkoutItemSchema).min(1),
  saleDiscount: discountSchema.optional()
});

export const paymentInputSchema = z.object({
  method: z.enum(paymentMethods),
  amount: z.coerce.number().positive(),
  provider: z.enum(paymentProviders).optional(),
  externalReference: z.string().max(120).optional().or(z.literal(""))
});

export const completeSaleSchema = z.object({
  payments: z.array(paymentInputSchema).min(1),
  idempotencyKey: z.string().min(36, "Idempotency key must be a valid UUID")
});

export const refundItemSchema = z.object({
  saleItemId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  restockAction: z.enum(restockActions)
});

export const refundSchema = z.object({
  items: z.array(refundItemSchema).min(1),
  reasonCode: z.string().min(2).max(80),
  note: z.string().min(2).max(240),
  idempotencyKey: z.string().min(36, "Idempotency key must be a valid UUID")
});
