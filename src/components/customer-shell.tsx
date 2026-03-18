"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { BarChart3, Package, ShoppingBag, ShoppingCart, User } from "lucide-react";

import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { href: "/orders/dashboard" as Route, label: "Dashboard", icon: BarChart3 },
  { href: "/shop" as Route, label: "Shop", icon: ShoppingBag },
  { href: "/cart" as Route, label: "Cart", icon: ShoppingCart },
  { href: "/orders" as Route, label: "My Orders", icon: Package }
] as const;

const mobileNavItems = [
  { href: "/orders/dashboard" as Route, label: "Dashboard", icon: BarChart3 },
  { href: "/shop" as Route, label: "Home", icon: ShoppingBag },
  { href: "/cart" as Route, label: "Cart", icon: ShoppingCart },
  { href: "/orders" as Route, label: "Orders", icon: Package },
  { href: "/profile" as Route, label: "Profile", icon: User }
] as const;

function isNavItemActive(pathname: string | null, href: Route) {
  if (!pathname) return false;
  if (href === ("/orders" as Route)) {
    return pathname === "/orders" || (pathname.startsWith("/orders/") && !pathname.startsWith("/orders/dashboard"));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CustomerShell({
  customerName,
  children
}: {
  customerName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-black text-white">
        <div className="page-shell flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight text-white">Human Pulse</span>
            <span className="hidden text-sm text-white/50 md:inline">|</span>
            <span className="hidden truncate text-sm text-white/50 md:inline">{customerName}</span>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isNavItemActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-white" />
                  )}
                </Link>
              );
            })}
            <div className="ml-1.5 w-auto">
              <SignOutButton />
            </div>
          </nav>
        </div>
      </header>

      <main className="page-shell pb-16 pt-8 md:pb-0 md:pt-8">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-white md:hidden">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "text-black"
                  : "text-muted-foreground hover:text-black"
              }`}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
