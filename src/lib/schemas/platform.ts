import { z } from "zod";

export const locationSchema = z.object({
  name: z.string().min(2).max(120),
  addressLine1: z.string().min(3).max(160),
  addressLine2: z.string().max(160).optional().or(z.literal("")),
  city: z.string().min(2).max(80),
  provinceOrState: z.string().min(2).max(80),
  postalCode: z.string().min(2).max(20),
  country: z.string().min(2).max(2),
  timezone: z.string().max(80).optional().or(z.literal("")),
});

export const updateLocationSchema = locationSchema.extend({
  locationId: z.string().min(1),
  isActive: z.boolean().optional(),
});

export const disputeEventSchema = z.object({
  body: z.string().min(2).max(2_000),
  visibility: z.enum(["internal", "external"]),
  eventType: z.enum(["note", "message"]).default("note"),
});

export const reportsExportFiltersSchema = z
  .object({
    type: z.enum(["sales", "products", "suppliers"]),
    locationId: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.type !== "sales" && (value.dateFrom || value.dateTo)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateFrom"],
        message: "Date filters are only supported for sales exports.",
      });
    }

    if (!value.dateFrom || !value.dateTo) {
      return;
    }

    const dateFrom = new Date(value.dateFrom);
    const dateTo = new Date(value.dateTo);
    if (Number.isNaN(dateFrom.getTime()) || Number.isNaN(dateTo.getTime())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateFrom"],
        message: "Invalid export date range.",
      });
      return;
    }

    if (dateFrom > dateTo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateFrom"],
        message: "Start date must be on or before end date.",
      });
    }
  });
