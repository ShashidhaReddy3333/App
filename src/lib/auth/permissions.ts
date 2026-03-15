import { UserRole } from "@prisma/client";

export type Permission =
  | "settings"
  | "staff"
  | "products"
  | "suppliers"
  | "inventory"
  | "sales"
  | "refunds"
  | "reports"
  | "sessions"
  | "reorder";

export const permissions = {
  owner: ["settings", "staff", "products", "suppliers", "inventory", "sales", "refunds", "reports", "sessions", "reorder"],
  manager: ["products", "suppliers", "inventory", "sales", "refunds", "reports", "reorder"],
  cashier: ["sales", "refunds"],
  inventory_staff: ["products", "inventory", "reorder"]
} as const satisfies Record<UserRole, readonly Permission[]>;

export function hasPermission(role: UserRole, permission: Permission) {
  return (permissions[role] as readonly Permission[]).includes(permission);
}
