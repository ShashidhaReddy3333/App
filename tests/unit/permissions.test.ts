import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";

describe("permission matrix", () => {
  it("allows owner-only session management", () => {
    expect(hasPermission("owner", "sessions")).toBe(true);
    expect(hasPermission("manager", "sessions")).toBe(false);
    expect(hasPermission("cashier", "sessions")).toBe(false);
  });

  it("keeps inventory staff out of sales while allowing catalog work", () => {
    expect(hasPermission("inventory_staff", "products")).toBe(true);
    expect(hasPermission("inventory_staff", "inventory")).toBe(true);
    expect(hasPermission("inventory_staff", "reorder")).toBe(true);
    expect(hasPermission("inventory_staff", "sales")).toBe(false);
  });

  it("allows managers to operate but not manage staff", () => {
    expect(hasPermission("manager", "sales")).toBe(true);
    expect(hasPermission("manager", "reports")).toBe(true);
    expect(hasPermission("manager", "staff")).toBe(false);
  });
});
