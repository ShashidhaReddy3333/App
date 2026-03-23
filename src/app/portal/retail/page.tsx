import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { BarChart3, Boxes, ShoppingCart, ShieldCheck, Store, Users } from "lucide-react";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth/session";
import { getCanonicalPath } from "@/lib/public-metadata";

export const metadata: Metadata = {
  title: "Retail Portal | Human Pulse",
  description:
    "Run checkout, products, inventory, procurement, staff, and reporting from the Human Pulse retail portal.",
  alternates: {
    canonical: getCanonicalPath("/"),
  },
};

const retailCapabilities = [
  {
    title: "Checkout and sales",
    description:
      "Run POS workflows, refunds, and online order operations from one operational view.",
    icon: ShoppingCart,
  },
  {
    title: "Inventory and procurement",
    description: "Keep products, suppliers, reorder, and receiving aligned across your business.",
    icon: Boxes,
  },
  {
    title: "Staff and control",
    description:
      "Use role-based access, session management, and audit-aware workflows built for store teams.",
    icon: Users,
  },
] as const;

export default async function RetailPortalHomePage() {
  const session = await getCurrentSession();

  if (session && ["owner", "manager", "cashier", "inventory_staff"].includes(session.user.role)) {
    redirect("/dashboard" as Route);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/30 bg-[hsl(var(--surface-lowest))]/90 backdrop-blur-[14px]">
        <nav className="page-shell flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-strong)))] text-sm font-bold text-white shadow-panel">
              HP
            </span>
            <div>
              <div className="text-lg font-semibold tracking-[-0.02em] text-foreground">
                Human Pulse
              </div>
              <div className="section-label">Retail Portal</div>
            </div>
          </Link>
          <div className="hidden items-center gap-2 sm:flex">
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Create Retail Account</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="page-shell space-y-16 py-10">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <div className="section-label">Control retail operations with clarity</div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-foreground sm:text-6xl">
                The Human Pulse retail portal is built for operators, not mixed audiences.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Run checkout, products, inventory, online orders, staff access, procurement, and
                reporting from a purpose-built retail workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/sign-in">Sign In to Retail Portal</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/sign-up">Create Retail Account</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/accept-invite">Accept Staff Invite</Link>
              </Button>
            </div>
          </div>

          <div className="surface-shell rounded-[32px] p-7">
            <div className="section-label">Operational priorities</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="data-row">
                <div className="text-4xl font-semibold tracking-[-0.04em] text-foreground">1</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Portal for POS, inventory, orders, reporting, and staff.
                </p>
              </div>
              <div className="data-row">
                <div className="text-4xl font-semibold tracking-[-0.04em] text-foreground">0</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Customer or supplier onboarding copy mixed into operator flows.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="data-row flex items-start gap-3">
                <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Role-based retail access</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Owners, managers, cashiers, and inventory staff get clean access boundaries
                    inside the retail workspace.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <div className="section-label">Retail capabilities</div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Built for store control and operational pace
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {retailCapabilities.map((capability) => {
              const Icon = capability.icon;
              return (
                <Card key={capability.title} className="gradient-panel">
                  <CardHeader>
                    <div className="mb-3 flex size-12 items-center justify-center rounded-[18px] bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle>{capability.title}</CardTitle>
                    <CardDescription>{capability.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="gradient-panel lg:col-span-2">
            <CardHeader>
              <div className="section-label">Portal modules</div>
              <CardTitle className="text-3xl">
                Everything retail teams need, separated from customer and supplier messaging
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="data-row">
                <div className="font-semibold text-foreground">Store operations</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Dashboard, checkout, sales, online orders, and refunds.
                </p>
              </div>
              <div className="data-row">
                <div className="font-semibold text-foreground">Stock control</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Products, suppliers, reorder, procurement, and receiving.
                </p>
              </div>
              <div className="data-row">
                <div className="font-semibold text-foreground">Governance</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reports, locations, staff, sessions, and owner operations.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-shell">
            <CardHeader>
              <div className="section-label">Retail trust</div>
              <CardTitle className="text-2xl">Operator-grade visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground">
                <Store className="size-4 text-primary" />
                Multi-role workspace
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <BarChart3 className="size-4 text-primary" />
                Live operational reporting
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <ShieldCheck className="size-4 text-primary" />
                Access isolation from customer and supplier portals
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
