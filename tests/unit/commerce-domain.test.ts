import { describe, expect, it } from "vitest";

import { formatOrderNumber, formatPurchaseOrderNumber, formatReceiptNumber } from "@/lib/domain/sales";
import { customerCheckoutSchema } from "@/lib/schemas/customer-commerce";

describe("commerce identifiers", () => {
  it("formats receipt, order, and purchase order numbers predictably", () => {
    expect(formatReceiptNumber(12)).toBe("RCPT-000012");
    expect(formatOrderNumber(34)).toBe("ORD-000034");
    expect(formatPurchaseOrderNumber(56)).toBe("PO-000056");
  });
});

describe("customer checkout schema", () => {
  it("requires an idempotency key for checkout", () => {
    const result = customerCheckoutSchema.safeParse({
      fulfillmentType: "pickup",
      paymentMethod: "credit_card",
      paymentProvider: "stripe"
    });

    expect(result.success).toBe(false);
  });

  it("requires a delivery address for delivery orders", () => {
    const result = customerCheckoutSchema.safeParse({
      fulfillmentType: "delivery",
      paymentMethod: "credit_card",
      paymentProvider: "stripe",
      idempotencyKey: "checkout-123"
    });

    expect(result.success).toBe(false);
  });
});
