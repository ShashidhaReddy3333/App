import Link from "next/link";
import type { Route } from "next";
import { UserRole } from "@prisma/client";
import { Activity, BarChart3, ClipboardCheck, ClipboardList, LayoutDashboard, Package, RotateCcw, ShieldCheck, ShoppingCart, Store, Truck, Users, Boxes } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { hasPermission } from "@/lib/rbac";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { href: "/app/dashboard" as Route, label: "Dashboard", icon: LayoutDashboard, permission: "sales" },
  { href: "/app/products" as Route, label: "Products", icon: Package, permission: "products" },
  { href: "/app/suppliers" as Route, label: "Suppliers", icon: Boxes, permission: "suppliers" },
  { href: "/app/checkout" as Route, label: "Checkout", icon: ShoppingCart, permission: "sales" },
  { href: "/app/sales" as Route, label: "Sales", icon: ClipboardList, permission: "sales" },
  { href: "/app/orders" as Route, label: "Online Orders", icon: Store, permission: "sales" },
  { href: "/app/refunds" as Route, label: "Refunds", icon: RotateCcw, permission: "refunds" },
  { href: "/app/reorder" as Route, label: "Reorder", icon: Truck, permission: "reorder" },
  { href: "/app/procurement" as Route, label: "Procurement", icon: ClipboardCheck, permission: "procurement" },
  { href: "/app/reports" as Route, label: "Reports", icon: BarChart3, permission: "reports" },
  { href: "/app/ops" as Route, label: "Operations", icon: Activity, permission: "owner_dashboard" },
  { href: "/app/staff" as Route, label: "Staff", icon: Users, permission: "staff" },
  { href: "/app/sessions" as Route, label: "Sessions", icon: ShieldCheck, permission: "sessions" }
] as const;

export function AppShell({
  role,
  businessName,
  userName,
  children
}: {
  role: UserRole;
  businessName: string;
  userName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-white/60 bg-white/80 px-5 py-6 backdrop-blur lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="space-y-6">
          <div className="space-y-2">
            <Badge>Business Management App</Badge>
            <div>
              <div className="text-lg font-semibold">{businessName}</div>
              <div className="text-sm text-muted-foreground">{userName}</div>
            </div>
          </div>
          <nav className="grid gap-1">
            {navItems
              .filter((item) => hasPermission(role, item.permission))
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
          </nav>
          <SignOutButton />
        </div>
      </aside>
      <div className="page-shell">{children}</div>
    </div>
  );
}
