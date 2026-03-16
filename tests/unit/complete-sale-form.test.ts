import { describe, expect, it } from "vitest";

import { buildCompleteSalePayload, createPaymentDraft, getPaymentTotal } from "@/lib/forms/complete-sale";

describe("complete sale form helpers", () => {
  it("filters placeholder zero-amount rows before building the API payload", () => {
    const result = buildCompleteSalePayload(
      {
        idempotencyKey: "idem-key-123",
        payments: [
          { ...createPaymentDraft(12.5), method: "cash" },
          { ...createPaymentDraft(0), method: "credit_card", provider: "manual" }
        ]
      },
      12.5
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.payments).toHaveLength(1);
      expect(result.payload.payments[0]?.amount).toBe(12.5);
    }
  });

  it("rejects completion when positive payments do not cover the amount due", () => {
    const result = buildCompleteSalePayload(
      {
        idempotencyKey: "idem-key-123",
        payments: [{ ...createPaymentDraft(10), method: "cash" }]
      },
      12.5
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("cover the total due");
    }
  });

  it("computes the entered payment total with currency rounding", () => {
    expect(getPaymentTotal([{ amount: 10.005 }, { amount: 5.005 }])).toBe(15.01);
  });
});
