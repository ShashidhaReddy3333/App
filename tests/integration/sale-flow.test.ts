import { describe, expect, it } from "vitest";

import { priceCheckout } from "@/lib/domain/pricing";
import { calculateRefundLineAmount, formatReceiptNumber, sumSuccessfulPayments } from "@/lib/domain/sales";

describe("sale flow math", () => {
  it("supports split payments and receipt sequencing", () => {
    const priced = priceCheckout(
      [
        {
          productId: "p1",
          productName: "Oil",
          category: "grocery",
          quantity: 2,
          unitPrice: 10.99
        }
      ],
      [{ name: "HST", ratePercent: 13 }],
      "exclusive_tax"
    );

    const amountPaid = sumSuccessfulPayments([
      { amount: 10, status: "settled" as const },
      { amount: priced.totalAmount - 10, status: "settled" as const }
    ]);

    expect(amountPaid).toBe(priced.totalAmount);
    expect(formatReceiptNumber(100)).toBe("RCPT-000100");
    expect(calculateRefundLineAmount(priced.items[0]!.lineTotal, 2, 1)).toBeGreaterThan(0);
  });
});
