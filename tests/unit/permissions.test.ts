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
    expect(hasPermission("inventory_staff", "suppliers")).toBe(false);
    expect(hasPermission("inventory_staff", "sales")).toBe(false);
  });

  it("allows managers to operate but not manage staff", () => {
    expect(hasPermission("manager", "sales")).toBe(true);
    expect(hasPermission("manager", "reports")).toBe(true);
    expect(hasPermission("manager", "suppliers")).toBe(true);
    expect(hasPermission("manager", "staff")).toBe(false);
  });

  it("splits customer and supplier access cleanly from operations roles", () => {
    expect(hasPermission("customer", "storefront")).toBe(true);
    expect(hasPermission("customer", "customer_account")).toBe(true);
    expect(hasPermission("customer", "sales")).toBe(false);

    expect(hasPermission("supplier", "supplier_portal")).toBe(true);
    expect(hasPermission("supplier", "products")).toBe(false);
    expect(hasPermission("supplier", "procurement")).toBe(false);
  });
});
