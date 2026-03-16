import { z } from "zod";

import { paymentMethods, paymentProviders } from "@/lib/schemas/sales";

export const addCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive()
});

export const removeCartItemSchema = z.object({
  itemId: z.string().min(1)
});

export const customerCheckoutSchema = z
  .object({
    fulfillmentType: z.enum(["pickup", "delivery"]),
    paymentMethod: z.enum(paymentMethods),
    paymentProvider: z.enum(paymentProviders).optional(),
    idempotencyKey: z.string().min(8),
    notes: z.string().max(240).optional().or(z.literal("")),
    address: z
      .object({
        label: z.string().min(2).max(40),
        line1: z.string().min(3).max(120),
        line2: z.string().max(120).optional().or(z.literal("")),
        city: z.string().min(2).max(80),
        province: z.string().min(2).max(80),
        postalCode: z.string().min(3).max(20),
        country: z.string().min(2).max(2)
      })
      .optional()
  })
  .superRefine((value, context) => {
    if (value.fulfillmentType === "delivery" && !value.address) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address"],
        message: "Delivery address is required for delivery orders."
      });
    }
  });
