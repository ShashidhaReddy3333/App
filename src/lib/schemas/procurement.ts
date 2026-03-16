import { z } from "zod";

export const supplierProductSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(240).optional().or(z.literal("")),
  mappedProductId: z.string().optional().or(z.literal("")),
  minimumOrderQuantity: z.coerce.number().positive(),
  casePackSize: z.coerce.number().int().positive().optional(),
  wholesalePrice: z.coerce.number().min(0),
  leadTimeDays: z.coerce.number().int().min(0),
  deliveryFee: z.coerce.number().min(0).optional(),
  serviceArea: z.string().max(120).optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal(""))
});

export const purchaseOrderItemInputSchema = z.object({
  supplierProductId: z.string().min(1),
  quantity: z.coerce.number().positive()
});

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1),
  locationId: z.string().min(1),
  expectedDeliveryDate: z.string().optional().or(z.literal("")),
  items: z.array(purchaseOrderItemInputSchema).min(1),
  idempotencyKey: z.string().min(8)
});

export const receivePurchaseOrderSchema = z.object({
  items: z.array(
    z.object({
      itemId: z.string().min(1),
      receivedQuantity: z.coerce.number().min(0)
    })
  ),
  idempotencyKey: z.string().min(8)
});

export const supplierOrderStatusSchema = z.object({
  status: z.enum(["accepted", "rejected"])
});
