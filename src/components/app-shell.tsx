"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { UserRole } from "@prisma/client";
import {
  Activity,
  BarChart3,
  Bell,
  Boxes,
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
  X,
} from "lucide-react";

import { KeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help";
import { SignOutButton } from "@/components/sign-out-button";
import { hasPermission } from "@/lib/rbac";

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
    href: "/app/locations" as Route,
    label: "Locations",
    icon: Store,
    permission: "settings",
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
    href: "/app/notifications" as Route,
    label: "Notifications",
    icon: Bell,
    permission: "sales",
    group: "admin",
  },
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
      <div className="space-y-4 px-5 pb-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-strong)))] text-white shadow-panel">
            <Activity className="size-5" />
          </div>
          <div>
            <span className="block text-lg font-semibold tracking-[-0.02em] text-foreground">
              Human Pulse
            </span>
            <span className="section-label">Retail Operations</span>
          </div>
        </div>
        <div className="rounded-[22px] border border-border/30 bg-[hsl(var(--surface-lowest)_/_0.9)] px-4 py-3 shadow-panel">
          <div className="truncate text-sm font-semibold text-foreground">{businessName}</div>
          <div className="truncate text-xs text-muted-foreground">{userName}</div>
        </div>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="space-y-1">
            <div className="px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
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
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "border border-border/30 bg-[hsl(var(--surface-lowest))] text-foreground shadow-panel"
                      : "text-muted-foreground hover:bg-[hsl(var(--surface-low))] hover:text-foreground"
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
      <div className="px-4 pb-4 pt-2">
        <SignOutButton className="w-full justify-center" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r border-border/30 bg-[hsl(var(--surface-high))]/65 backdrop-blur-[14px] lg:block lg:min-h-screen">
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[rgba(20,27,43,0.24)] backdrop-blur-sm lg:hidden"
          role="button"
          aria-label="Close sidebar"
          tabIndex={0}
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              setSidebarOpen(false);
            }
          }}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[300px] transform border-r border-border/30 bg-[hsl(var(--surface-high))] shadow-float transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute right-3 top-4 z-10">
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[hsl(var(--surface-low))] hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      <div className="min-w-0">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/30 bg-[hsl(var(--surface-lowest))]/85 px-4 py-3 backdrop-blur-[12px] lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
            className="flex size-9 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-[hsl(var(--surface-low))] hover:text-foreground"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <span className="text-sm font-semibold tracking-[-0.02em] text-foreground">
              Human Pulse
            </span>
          </div>
        </div>
        <div className="page-shell" id="main-content">
          {children}
        </div>
      </div>
      <KeyboardShortcutsHelp />
    </div>
  );
}
