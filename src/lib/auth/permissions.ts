import { UserRole } from "@prisma/client";

export type Permission =
  | "storefront"
  | "customer_account"
  | "settings"
  | "staff"
  | "products"
  | "suppliers"
  | "inventory"
  | "sales"
  | "refunds"
  | "reports"
  | "sessions"
  | "reorder"
  | "procurement"
  | "supplier_portal"
  | "owner_dashboard";

export const permissions = {
  customer: ["storefront", "customer_account"],
  owner: ["settings", "staff", "products", "suppliers", "inventory", "sales", "refunds", "reports", "sessions", "reorder", "procurement", "owner_dashboard"],
  manager: ["products", "suppliers", "inventory", "sales", "refunds", "reports", "reorder", "procurement"],
  cashier: ["sales", "refunds"],
  inventory_staff: ["products", "inventory", "reorder", "procurement"],
  supplier: ["supplier_portal"],
  platform_admin: ["settings", "staff", "reports", "sessions", "owner_dashboard"]
} as const satisfies Record<UserRole, readonly Permission[]>;

export function hasPermission(role: UserRole, permission: Permission) {
  return (permissions[role] as readonly Permission[]).includes(permission);
}
