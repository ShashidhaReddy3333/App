"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { LayoutDashboard, Package, ClipboardList, Menu, X, Warehouse } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { href: "/supplier/dashboard" as Route, label: "Dashboard", icon: LayoutDashboard },
  { href: "/supplier/catalog" as Route, label: "Wholesale Catalog", icon: Package },
  { href: "/supplier/orders" as Route, label: "Retailer Orders", icon: ClipboardList },
] as const;

export function SupplierShell({
  supplierName,
  userName,
  children,
}: {
  supplierName: string;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="space-y-4 px-5 pb-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-strong)))] text-white shadow-panel">
            <Warehouse className="size-5" />
          </div>
          <div>
            <span className="block text-lg font-semibold tracking-[-0.02em] text-foreground">
              Human Pulse
            </span>
            <div className="section-label">Supplier Network</div>
          </div>
        </div>
        <div className="rounded-[22px] border border-border/30 bg-[hsl(var(--surface-lowest)_/_0.9)] px-4 py-3 shadow-panel">
          <div className="truncate text-sm font-semibold text-foreground">{supplierName}</div>
          <div className="truncate text-xs text-muted-foreground">{userName}</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
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
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
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

      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[rgba(20,27,43,0.24)] backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation menu"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[300px] transform border-r border-border/30 bg-[hsl(var(--surface-high))] shadow-float transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute right-3 top-4 z-10">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[hsl(var(--surface-low))] hover:text-foreground"
            aria-label="Close navigation menu"
          >
            <X className="size-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      <div className="min-w-0">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/30 bg-[hsl(var(--surface-lowest))]/85 px-4 py-3 backdrop-blur-[12px] lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex size-9 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-[hsl(var(--surface-low))] hover:text-foreground"
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <Warehouse className="size-4 text-primary" />
            <span className="text-sm font-semibold tracking-[-0.02em] text-foreground">
              Supplier Portal
            </span>
          </div>
          <Badge variant="outline" className="ml-auto">
            Wholesale
          </Badge>
        </div>
        <div className="page-shell py-8">{children}</div>
      </div>
    </div>
  );
}
