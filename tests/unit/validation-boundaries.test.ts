import { describe, expect, it } from "vitest";

import { signUpSchema, customerSignUpSchema } from "@/lib/schemas/auth";
import { productSchema, inventoryAdjustmentSchema } from "@/lib/schemas/catalog";
import { checkoutItemSchema, checkoutSchema, paymentInputSchema } from "@/lib/schemas/sales";

const validIdempotencyKey = "00000000-0000-4000-8000-000000000001";

describe("auth schema password boundaries", () => {
  const validSignUp = {
    ownerName: "Jane Doe",
    email: "jane@example.com",
    password: "StrongPass1!",
    businessName: "Test Shop",
    businessType: "retail_store" as const,
    primaryCountry: "US",
    timezone: "America/New_York",
    currency: "USD",
    taxMode: "no_tax" as const,
    addressLine1: "123 Main St",
    city: "Springfield",
    provinceOrState: "IL",
    postalCode: "62701",
  };

  it("rejects password under 10 characters", () => {
    const result = signUpSchema.safeParse({ ...validSignUp, password: "Short1Aa" });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase letter", () => {
    const result = signUpSchema.safeParse({ ...validSignUp, password: "alllowercase1" });
    expect(result.success).toBe(false);
  });

  it("rejects password without digit", () => {
    const result = signUpSchema.safeParse({ ...validSignUp, password: "NoDigitsHere!" });
    expect(result.success).toBe(false);
  });

  it("rejects password without lowercase letter", () => {
    const result = signUpSchema.safeParse({ ...validSignUp, password: "ALLUPPERCASE1" });
    expect(result.success).toBe(false);
  });

  it("accepts valid password meeting all rules", () => {
    const result = signUpSchema.safeParse(validSignUp);
    expect(result.success).toBe(true);
  });

  it("applies the same password rules to customerSignUpSchema", () => {
    const weak = customerSignUpSchema.safeParse({
      fullName: "Test User",
      email: "test@example.com",
      password: "short1A",
    });
    expect(weak.success).toBe(false);

    const strong = customerSignUpSchema.safeParse({
      fullName: "Test User",
      email: "test@example.com",
      password: "StrongPass1!",
    });
    expect(strong.success).toBe(true);
  });
});

describe("auth schema required-field boundaries", () => {
  it("rejects empty string for ownerName", () => {
    const result = signUpSchema.safeParse({
      ownerName: "",
      email: "a@b.com",
      password: "StrongPass1!",
      businessName: "Shop",
      businessType: "retail_store",
      primaryCountry: "US",
      timezone: "America/New_York",
      currency: "USD",
      taxMode: "no_tax",
      addressLine1: "123 Main",
      city: "Springfield",
      provinceOrState: "IL",
      postalCode: "62701",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty string for email", () => {
    const result = signUpSchema.safeParse({
      ownerName: "Jane",
      email: "",
      password: "StrongPass1!",
      businessName: "Shop",
      businessType: "retail_store",
      primaryCountry: "US",
      timezone: "America/New_York",
      currency: "USD",
      taxMode: "no_tax",
      addressLine1: "123 Main",
      city: "Springfield",
      provinceOrState: "IL",
      postalCode: "62701",
    });
    expect(result.success).toBe(false);
  });
});

describe("product schema price and quantity boundaries", () => {
  const validProduct = {
    locationId: "loc_1",
    name: "Widget",
    category: "Gadgets",
    sku: "WDG-001",
    unitType: "each",
    purchasePrice: 10,
    sellingPrice: 20,
    parLevel: 5,
    openingStock: 10,
  };

  it("rejects negative purchase price", () => {
    const result = productSchema.safeParse({ ...validProduct, purchasePrice: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects negative selling price", () => {
    const result = productSchema.safeParse({ ...validProduct, sellingPrice: -5 });
    expect(result.success).toBe(false);
  });

  it("allows zero price (free product)", () => {
    const result = productSchema.safeParse({ ...validProduct, sellingPrice: 0, purchasePrice: 0 });
    expect(result.success).toBe(true);
  });

  it("rejects empty string for name", () => {
    const result = productSchema.safeParse({ ...validProduct, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding max length of 120 chars", () => {
    const result = productSchema.safeParse({ ...validProduct, name: "x".repeat(121) });
    expect(result.success).toBe(false);
  });

  it("accepts name at exactly max length of 120 chars", () => {
    const result = productSchema.safeParse({ ...validProduct, name: "x".repeat(120) });
    expect(result.success).toBe(true);
  });
});

describe("checkout item schema quantity boundaries", () => {
  it("rejects zero quantity", () => {
    const result = checkoutItemSchema.safeParse({
      productId: "prod_1",
      quantity: 0,
      unitPrice: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative quantity", () => {
    const result = checkoutItemSchema.safeParse({
      productId: "prod_1",
      quantity: -1,
      unitPrice: 10,
    });
    expect(result.success).toBe(false);
  });

  it("accepts positive quantity", () => {
    const result = checkoutItemSchema.safeParse({
      productId: "prod_1",
      quantity: 1,
      unitPrice: 10,
    });
    expect(result.success).toBe(true);
  });
});

describe("checkout schema items boundary", () => {
  it("rejects empty items array", () => {
    const result = checkoutSchema.safeParse({
      locationId: "loc_1",
      items: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("payment input schema amount boundaries", () => {
  it("rejects zero payment amount", () => {
    const result = paymentInputSchema.safeParse({
      method: "cash",
      amount: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative payment amount", () => {
    const result = paymentInputSchema.safeParse({
      method: "cash",
      amount: -10,
    });
    expect(result.success).toBe(false);
  });
});

describe("inventory adjustment schema quantity delta boundary", () => {
  it("rejects zero quantity delta", () => {
    const result = inventoryAdjustmentSchema.safeParse({
      locationId: "loc_1",
      productId: "prod_1",
      quantityDelta: 0,
      reason: "Correction",
      idempotencyKey: validIdempotencyKey,
    });
    expect(result.success).toBe(false);
  });

  it("accepts positive quantity delta", () => {
    const result = inventoryAdjustmentSchema.safeParse({
      locationId: "loc_1",
      productId: "prod_1",
      quantityDelta: 5,
      reason: "Restock",
      idempotencyKey: validIdempotencyKey,
    });
    expect(result.success).toBe(true);
  });

  it("accepts negative quantity delta", () => {
    const result = inventoryAdjustmentSchema.safeParse({
      locationId: "loc_1",
      productId: "prod_1",
      quantityDelta: -3,
      reason: "Damaged",
      idempotencyKey: validIdempotencyKey,
    });
    expect(result.success).toBe(true);
  });
});
