import Link from "next/link";
import type { Route } from "next";
import { Package, ShoppingCart, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { href: "/shop" as Route, label: "Shop", icon: Store },
  { href: "/cart" as Route, label: "Cart", icon: ShoppingCart },
  { href: "/orders" as Route, label: "My Orders", icon: Package },
] as const;

export function CustomerShell({
  customerName,
  children,
}: {
  customerName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/30 bg-[hsl(var(--surface-lowest))]/85 backdrop-blur-[12px]">
        <div className="page-shell flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-strong)))] text-white shadow-panel">
              <Store className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tracking-[-0.02em]">Human Pulse</span>
                <Badge variant="outline" className="hidden sm:inline-flex">
                  Storefront
                </Badge>
              </div>
              <div className="truncate text-xs text-muted-foreground">{customerName}</div>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex items-center gap-1.5 rounded-full border border-border/25 bg-[hsl(var(--surface-lowest))]/85 px-3.5 py-2 text-sm font-medium text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all hover:border-primary/20 hover:bg-[hsl(var(--surface-low))] hover:text-foreground"
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                  {/* TODO: Show actual cart item count badge */}
                </Link>
              );
            })}
            <div className="ml-1.5 w-auto">
              <SignOutButton />
            </div>
          </nav>
        </div>
      </header>
      <main id="main-content" className="page-shell py-8">
        {children}
      </main>
    </div>
  );
}
