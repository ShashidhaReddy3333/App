import { PaymentStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { calculateRefundLineAmount, formatReceiptNumber, sumSuccessfulPayments } from "@/lib/domain/sales";

describe("sales domain helpers", () => {
  it("formats sequential receipt numbers", () => {
    expect(formatReceiptNumber(1)).toBe("RCPT-000001");
    expect(formatReceiptNumber(42)).toBe("RCPT-000042");
  });

  it("prorates refund amount by quantity", () => {
    expect(calculateRefundLineAmount(32.77, 2, 1)).toBe(16.39);
  });

  it("sums only successful payment statuses", () => {
    expect(
      sumSuccessfulPayments([
        { amount: 10, status: PaymentStatus.settled },
        { amount: 5, status: PaymentStatus.failed },
        { amount: 3.5, status: PaymentStatus.authorized }
      ])
    ).toBe(13.5);
  });
});
