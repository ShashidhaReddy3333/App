import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(2).max(120),
  contactName: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal(""))
});

export const productSchema = z.object({
  locationId: z.string().min(1),
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(60),
  sku: z.string().min(2).max(60),
  barcode: z.string().max(60).optional().or(z.literal("")),
  supplierId: z.string().optional().or(z.literal("")),
  unitType: z.string().min(1).max(30),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  taxCategory: z.string().max(60).optional().or(z.literal("")),
  parLevel: z.coerce.number().min(0),
  openingStock: z.coerce.number().min(0),
  allowOversell: z.boolean().optional().default(false)
});

export const inventoryAdjustmentSchema = z.object({
  locationId: z.string().min(1),
  productId: z.string().min(1),
  quantityDelta: z.coerce.number().refine((value) => value !== 0, "Quantity delta cannot be zero."),
  reason: z.string().min(2).max(120),
  idempotencyKey: z.string().min(36, "Idempotency key must be a valid UUID")
});
