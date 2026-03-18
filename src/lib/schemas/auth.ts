import { z } from "zod";

const strongPasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, "Password must include uppercase, lowercase, number, and special character");

export const signUpSchema = z.object({
  ownerName: z.string().min(2).max(100),
  email: z.string().email(),
  password: strongPasswordSchema,
  businessName: z.string().min(2).max(100),
  businessType: z.enum([
    "retail_store",
    "grocery",
    "clothing",
    "pharmacy",
    "convenience",
    "online_seller",
    "wholesale",
    "service_with_products"
  ]),
  primaryCountry: z.string().min(2).max(2),
  timezone: z.string().min(1),
  currency: z.string().length(3),
  taxMode: z.enum(["no_tax", "inclusive_tax", "exclusive_tax"]),
  addressLine1: z.string().min(3),
  city: z.string().min(2),
  provinceOrState: z.string().min(2),
  postalCode: z.string().min(3),
  defaultTaxName: z.string().max(30).optional().or(z.literal("")),
  defaultTaxRate: z.coerce.number().min(0).max(100).optional()
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required")
});

export const customerSignUpSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  password: strongPasswordSchema
});

export const supplierSignUpSchema = z.object({
  fullName: z.string().min(2).max(100),
  businessName: z.string().min(2).max(100),
  email: z.string().email(),
  password: strongPasswordSchema,
  phone: z.string().min(7).max(30).optional().or(z.literal("")),
  notes: z.string().max(240).optional().or(z.literal(""))
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  password: strongPasswordSchema
});

export const inviteStaffSchema = z.object({
  email: z.string().email(),
  role: z.enum(["manager", "cashier", "inventory_staff"])
});

export const acceptInviteSchema = z.object({
  token: z.string().min(10),
  fullName: z.string().min(2).max(100),
  password: strongPasswordSchema
});
