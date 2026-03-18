import { z } from "zod";

export const signUpSchema = z.object({
  ownerName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit"),
  businessName: z.string().min(2).max(100),
  businessType: z.enum([
    "retail_store",
    "grocery",
    "clothing",
    "pharmacy",
    "convenience",
    "online_seller",
    "wholesale",
    "service_with_products",
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
  defaultTaxRate: z.coerce.number().min(0).max(100).optional(),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const customerSignUpSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit"),
});

export const supplierSignUpSchema = z.object({
  fullName: z.string().min(2).max(100),
  businessName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit"),
  phone: z.string().min(7).max(30).optional().or(z.literal("")),
  notes: z.string().max(240).optional().or(z.literal("")),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit"),
});

export const inviteStaffSchema = z.object({
  email: z.string().email(),
  role: z.enum(["manager", "cashier", "inventory_staff"]),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(10),
  fullName: z.string().min(2).max(100),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit"),
});
