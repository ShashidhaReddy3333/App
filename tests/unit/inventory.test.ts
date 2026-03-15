import { describe, expect, it } from "vitest";

import { canReserveStock, computeAvailableQuantity, computeReorderQuantity } from "@/lib/domain/inventory";

describe("inventory domain", () => {
  it("computes available quantity", () => {
    expect(computeAvailableQuantity(10, 3)).toBe(7);
  });

  it("computes reorder quantity from par level gap", () => {
    expect(computeReorderQuantity(40, 12)).toBe(28);
  });

  it("prevents oversell by default", () => {
    expect(canReserveStock(1, 2, false)).toBe(false);
    expect(canReserveStock(1, 2, true)).toBe(true);
  });
});
