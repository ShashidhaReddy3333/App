"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { UserRole } from "@prisma/client";
import {
  Activity,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Package,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Boxes,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { hasPermission } from "@/lib/rbac";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  {
    href: "/app/dashboard" as Route,
    label: "Dashboard",
    icon: LayoutDashboard,
    permission: "sales",
    group: "overview",
  },
  {
    href: "/app/checkout" as Route,
    label: "Checkout",
    icon: ShoppingCart,
    permission: "sales",
    group: "sales",
  },
  {
    href: "/app/sales" as Route,
    label: "Sales",
    icon: ClipboardList,
    permission: "sales",
    group: "sales",
  },
  {
    href: "/app/orders" as Route,
    label: "Online Orders",
    icon: Store,
    permission: "sales",
    group: "sales",
  },
  {
    href: "/app/refunds" as Route,
    label: "Refunds",
    icon: RotateCcw,
    permission: "refunds",
    group: "sales",
  },
  {
    href: "/app/products" as Route,
    label: "Products",
    icon: Package,
    permission: "products",
    group: "inventory",
  },
  {
    href: "/app/suppliers" as Route,
    label: "Suppliers",
    icon: Boxes,
    permission: "suppliers",
    group: "inventory",
  },
  {
    href: "/app/reorder" as Route,
    label: "Reorder",
    icon: Truck,
    permission: "reorder",
    group: "inventory",
  },
  {
    href: "/app/procurement" as Route,
    label: "Procurement",
    icon: ClipboardCheck,
    permission: "procurement",
    group: "inventory",
  },
  {
    href: "/app/reports" as Route,
    label: "Reports",
    icon: BarChart3,
    permission: "reports",
    group: "admin",
  },
  {
    href: "/app/ops" as Route,
    label: "Operations",
    icon: Activity,
    permission: "owner_dashboard",
    group: "admin",
  },
  { href: "/app/staff" as Route, label: "Staff", icon: Users, permission: "staff", group: "admin" },
  {
    href: "/app/sessions" as Route,
    label: "Sessions",
    icon: ShieldCheck,
    permission: "sessions",
    group: "admin",
  },
] as const;

const groupLabels: Record<string, string> = {
  overview: "Overview",
  sales: "Sales & Orders",
  inventory: "Inventory",
  admin: "Administration",
};

export function AppShell({
  role,
  businessName,
  userName,
  children,
}: {
  role: UserRole;
  businessName: string;
  userName: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const filteredItems = navItems.filter((item) => hasPermission(role, item.permission));

  const groups = filteredItems.reduce<Record<string, typeof filteredItems>>((acc, item) => {
    const group = item.group;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group]!.push(item);
    return acc;
  }, {});

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="space-y-1 px-5 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10">
            <Activity className="size-4 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">Human Pulse</span>
        </div>
      </div>
      <div className="border-t border-border/40 mx-5" />
      <div className="px-5 pt-4 pb-2">
        <div className="text-sm font-semibold truncate">{businessName}</div>
        <div className="text-xs text-muted-foreground truncate">{userName}</div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {groupLabels[group] ?? group}
            </div>
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-border/40 mx-5" />
      <div className="p-4">
        <SignOutButton />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block border-r border-border/40 bg-white/80 backdrop-blur lg:min-h-screen">
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          role="button"
          aria-label="Close sidebar"
          tabIndex={0}
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setSidebarOpen(false);
          }}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] transform border-r border-border/40 bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute right-3 top-4 z-10">
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      <div className="page-shell">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/40 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="size-3 text-primary" />
            </div>
            <span className="text-sm font-bold tracking-tight">Human Pulse</span>
          </div>
        </div>
        <div id="main-content">{children}</div>
      </div>
    </div>
  );
}
