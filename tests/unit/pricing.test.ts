import { describe, expect, it } from "vitest";

import { priceCheckout } from "@/lib/domain/pricing";

describe("priceCheckout", () => {
  it("applies line and sale discounts before tax", () => {
    const result = priceCheckout(
      [
        {
          productId: "p1",
          productName: "Rice",
          category: "grocery",
          quantity: 2,
          unitPrice: 10,
          discount: { type: "percentage", value: 10, scope: "line_item", reason: "promo" }
        },
        {
          productId: "p2",
          productName: "Milk",
          category: "dairy",
          quantity: 1,
          unitPrice: 5
        }
      ],
      [{ name: "HST", ratePercent: 13 }],
      "exclusive_tax",
      { type: "fixed_amount", value: 1, scope: "sale", reason: "goodwill" }
    );

    expect(result.subtotalAmount).toBe(25);
    expect(result.discountAmount).toBeGreaterThan(0);
    expect(result.taxAmount).toBeGreaterThan(0);
    expect(result.totalAmount).toBeGreaterThan(result.subtotalAmount - result.discountAmount);
  });
});
