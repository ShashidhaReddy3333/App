import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import {
  ArrowRightLeft,
  ClipboardList,
  Package,
  ShieldCheck,
  Truck,
  Warehouse,
} from "lucide-react";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth/session";
import { getCanonicalPath } from "@/lib/public-metadata";

export const metadata: Metadata = {
  title: "Supplier Portal | Human Pulse",
  description:
    "Manage wholesale products, retailer purchase orders, and fulfillment updates in the Human Pulse supplier portal.",
  alternates: {
    canonical: getCanonicalPath("/"),
  },
};

const supplyFeatures = [
  {
    title: "Catalog management",
    description:
      "Publish wholesale products, pricing, lead times, and mapped items without mixing in retailer setup screens.",
    icon: Package,
  },
  {
    title: "Retailer order inbox",
    description:
      "Review purchase orders and keep status visible from acceptance through shipment and fulfillment.",
    icon: ClipboardList,
  },
  {
    title: "Relationship workflow",
    description: "Operate a focused B2B workspace for retailer coordination and supply visibility.",
    icon: ArrowRightLeft,
  },
] as const;

export default async function SupplyPortalHomePage() {
  const session = await getCurrentSession();

  if (session?.user.role === "supplier") {
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
              <div className="section-label">Supplier Portal</div>
            </div>
          </Link>
          <div className="hidden items-center gap-2 sm:flex">
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Request Access</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="page-shell space-y-16 py-10">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <div className="section-label">Reliable B2B fulfillment starts here</div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-foreground sm:text-6xl">
                The Human Pulse supplier portal keeps catalog and retailer order workflows in one
                place.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Manage wholesale products, review purchase orders, communicate fulfillment progress,
                and keep retailer relationships moving through a dedicated supplier workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/sign-in">Sign In to Supplier Portal</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/sign-up">Request Supplier Access</Link>
              </Button>
            </div>
          </div>

          <div className="surface-shell rounded-[32px] p-7">
            <div className="section-label">Supplier priorities</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="data-row">
                <div className="text-4xl font-semibold tracking-[-0.04em] text-foreground">B2B</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Catalog and purchase-order management built around retailer relationships.
                </p>
              </div>
              <div className="data-row">
                <div className="text-4xl font-semibold tracking-[-0.04em] text-foreground">
                  24/7
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Status visibility without depending on retailer dashboards or customer surfaces.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="data-row flex items-start gap-3">
                <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Truck className="size-5" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Fulfillment stays explicit</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Accept, ship, and update retailer orders from a supplier-only view without
                    customer or retailer onboarding clutter.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <div className="section-label">Supplier capabilities</div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Designed for reliability and fulfillment clarity
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {supplyFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="gradient-panel">
                  <CardHeader>
                    <div className="mb-3 flex size-12 items-center justify-center rounded-[18px] bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="gradient-panel lg:col-span-2">
            <CardHeader>
              <div className="section-label">Supplier workflow</div>
              <CardTitle className="text-3xl">
                A dedicated surface for catalog, orders, and fulfillment updates
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="data-row">
                <div className="font-semibold text-foreground">Publish catalog</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep product availability, pricing, and lead-time details visible.
                </p>
              </div>
              <div className="data-row">
                <div className="font-semibold text-foreground">Manage retailer orders</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Accept, reject, or ship purchase orders from a supplier-owned queue.
                </p>
              </div>
              <div className="data-row">
                <div className="font-semibold text-foreground">Stay aligned</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Give retailer teams reliable status signals without crossing portals.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-shell">
            <CardHeader>
              <div className="section-label">Supplier trust</div>
              <CardTitle className="text-2xl">Portal separation by design</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground">
                <Warehouse className="size-4 text-primary" />
                Supplier-only onboarding
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <ClipboardList className="size-4 text-primary" />
                Retailer order visibility
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <ShieldCheck className="size-4 text-primary" />
                No customer or retail workspace leakage
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
