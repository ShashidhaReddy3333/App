import Link from "next/link";
import type { Route } from "next";

import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { href: "/shop" as Route, label: "Shop" },
  { href: "/cart" as Route, label: "Cart" },
  { href: "/orders" as Route, label: "My Orders" }
] as const;

export function CustomerShell({
  customerName,
  children
}: {
  customerName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="page-shell flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Badge>Customer App</Badge>
            <div>
              <div className="text-xl font-semibold">Shashi Mart Online</div>
              <div className="text-sm text-muted-foreground">Signed in as {customerName}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="page-shell py-8">{children}</main>
    </div>
  );
}
