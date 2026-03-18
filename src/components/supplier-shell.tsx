"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { LayoutDashboard, Package, ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { href: "/supplier/dashboard" as Route, label: "Dashboard", icon: LayoutDashboard },
  { href: "/supplier/catalog" as Route, label: "Wholesale Catalog", icon: Package },
  { href: "/supplier/orders" as Route, label: "Retailer Orders", icon: ClipboardList }
] as const;

export function SupplierShell({
  supplierName,
  userName,
  children
}: {
  supplierName: string;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="bg-black px-5 py-6 lg:min-h-screen">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">Human Pulse</span>
              <Badge variant="outline" className="border-white/20 text-white/70">Supplier Portal</Badge>
            </div>
            <div className="rounded-lg bg-white/10 px-3 py-2.5">
              <div className="text-sm font-semibold text-white">{supplierName}</div>
              <div className="text-xs text-white/60">{userName}</div>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto lg:grid lg:overflow-visible">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden lg:block">
            <SignOutButton variant="dark" />
          </div>
        </div>
      </aside>
      <div className="page-shell py-8">{children}</div>
    </div>
  );
}
