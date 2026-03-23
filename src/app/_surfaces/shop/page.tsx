import type { Metadata } from "next";
import Link from "next/link";
import { Package, Search, ShieldCheck, ShoppingBag, Sparkles, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth/session";
import { getCanonicalPath } from "@/lib/public-metadata";

export const metadata: Metadata = {
  title: "Customer Portal | Human Pulse",
  description:
    "Browse products, discover stores, place orders, and track purchases in the Human Pulse customer portal.",
  alternates: {
    canonical: getCanonicalPath("/"),
  },
};

const shopFeatures = [
  {
    title: "Browse with confidence",
    description:
      "Discover products, store availability, and order-ready essentials in one customer-first experience.",
    icon: Search,
  },
  {
    title: "Secure checkout",
    description:
      "Move from product selection to pickup or delivery with a clean, trusted ordering flow.",
    icon: ShieldCheck,
  },
  {
    title: "Track every purchase",
    description:
      "Follow fulfillment updates, review history, and reorder faster from one customer account.",
    icon: Package,
  },
] as const;

export default async function ShopPortalHomePage() {
  const session = await getCurrentSession();
  const isCustomer = session?.user.role === "customer";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/30 bg-[hsl(var(--surface-lowest))]/85 backdrop-blur-[12px]">
        <nav className="page-shell flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-strong)))] text-sm font-bold text-white shadow-panel">
              HP
            </span>
            <div>
              <div className="text-lg font-semibold tracking-[-0.02em] text-foreground">
                Human Pulse
              </div>
              <div className="section-label">Customer Portal</div>
            </div>
          </Link>
          <div className="hidden items-center gap-2 sm:flex">
            <Button asChild variant="ghost" size="sm">
              <Link href="/marketplace">Marketplace</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={isCustomer ? "/orders" : "/sign-in"}>
                {isCustomer ? "My Orders" : "Sign In"}
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={isCustomer ? "/shop" : "/sign-up"}>
                {isCustomer ? "Shop Now" : "Create Account"}
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="page-shell space-y-16 py-10">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <div className="section-label">Discover. Order. Track.</div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-foreground sm:text-6xl">
                Shop the Human Pulse network with a portal built for customers.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Browse products, discover participating stores, place pickup or delivery orders, and
                keep every purchase visible from one customer-only experience.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/shop">
                  Browse Products
                  <ShoppingBag className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/marketplace">Explore Marketplace</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={isCustomer ? "/orders" : "/sign-up"}>
                  {isCustomer ? "Track Purchases" : "Create Account"}
                </Link>
              </Button>
            </div>
          </div>

          <div className="surface-shell rounded-[32px] p-7">
            <div className="section-label">Why customers use it</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="data-row">
                <div className="text-4xl font-semibold tracking-[-0.04em] text-foreground">1</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Customer account for browsing, checkout, and orders.
                </p>
              </div>
              <div className="data-row">
                <div className="text-4xl font-semibold tracking-[-0.04em] text-foreground">2</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fulfillment options designed around pickup and delivery.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="data-row flex items-start gap-3">
                <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Truck className="size-5" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    Order tracking that stays clear
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Follow status changes, fulfillment progress, and past purchases without stepping
                    into retailer or supplier workflows.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <div className="section-label">Customer portal features</div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Built for convenience and trust
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {shopFeatures.map((feature) => {
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
              <div className="section-label">Get started</div>
              <CardTitle className="text-3xl">Open the right customer path</CardTitle>
              <CardDescription>
                Jump straight into shopping, store discovery, or order tracking without crossing
                into retailer or supplier workflows.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Link href="/shop" className="data-row">
                <div className="font-semibold text-foreground">Browse Shop</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Start with product browsing and add items to your cart.
                </p>
              </Link>
              <Link href="/marketplace" className="data-row">
                <div className="font-semibold text-foreground">Explore Stores</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Discover participating businesses and customer-facing catalog pages.
                </p>
              </Link>
              <Link href={isCustomer ? "/orders" : "/sign-in"} className="data-row">
                <div className="font-semibold text-foreground">
                  {isCustomer ? "View Orders" : "Sign In"}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep purchases, status history, and repeat orders organized.
                </p>
              </Link>
            </CardContent>
          </Card>

          <Card className="surface-shell">
            <CardHeader>
              <div className="section-label">Portal promise</div>
              <CardTitle className="text-2xl">Customer-only messaging</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Retail operations and supplier workflows live in their own portals.</p>
              <p>
                This surface stays focused on discovery, shopping, checkout, and order visibility.
              </p>
              <div className="flex items-center gap-2 rounded-2xl bg-primary/10 px-3 py-2 text-primary">
                <Sparkles className="size-4" />
                Human Pulse keeps the customer journey intentionally separate.
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
