import Link from "next/link";
import type { Route } from "next";

import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { href: "/supplier/dashboard" as Route, label: "Dashboard" },
  { href: "/supplier/catalog" as Route, label: "Wholesale Catalog" },
  { href: "/supplier/orders" as Route, label: "Retailer Orders" }
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
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-white/60 bg-white/90 px-5 py-6 backdrop-blur lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="space-y-6">
          <div className="space-y-2">
            <Badge>Supplier Portal</Badge>
            <div>
              <div className="text-lg font-semibold">{supplierName}</div>
              <div className="text-sm text-muted-foreground">{userName}</div>
            </div>
          </div>
          <nav className="grid gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <SignOutButton />
        </div>
      </aside>
      <div className="page-shell py-8">{children}</div>
    </div>
  );
}
