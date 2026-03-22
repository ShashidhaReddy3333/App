import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3, Globe, Shield, ShoppingBag, Store, Truck, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPostSignInPath } from "@/lib/auth/guards";
import { getCurrentSession } from "@/lib/auth/session";
import { getCanonicalPath } from "@/lib/public-metadata";

export const metadata: Metadata = {
  title: "Human Pulse | Commerce Operating System",
  description:
    "Run customer ordering, POS checkout, inventory, supplier procurement, and analytics from one commerce platform.",
  alternates: {
    canonical: getCanonicalPath("/"),
  },
};

const portals = [
  {
    href: "/shop" as Route,
    title: "Customer storefront",
    description: "Discover products, place orders, and track fulfillment across connected stores.",
    cta: "Browse Store",
    icon: ShoppingBag,
  },
  {
    href: "/sign-in" as Route,
    title: "Retail operations",
    description:
      "Run checkout, inventory, staff access, refunds, and business reporting from one system.",
    cta: "Open Dashboard",
    icon: Store,
  },
  {
    href: "/supplier/sign-up" as Route,
    title: "Supplier network",
    description: "Manage wholesale catalogs, retailer orders, pricing, and fulfillment workflows.",
    cta: "Become a Supplier",
    icon: Truck,
  },
] as const;

const capabilityCards = [
  {
    title: "Live inventory ledger",
    description: "A shared operational layer keeps online ordering and in-store checkout aligned.",
    icon: Zap,
  },
  {
    title: "Role-based control",
    description:
      "Separate cashier, manager, owner, supplier, customer, and admin access without extra tooling.",
    icon: Shield,
  },
  {
    title: "Owner analytics",
    description:
      "Surface sales, reorder gaps, disputes, and system health in one operational cockpit.",
    icon: BarChart3,
  },
  {
    title: "Multi-portal commerce",
    description:
      "Public storefront, retail ops, suppliers, and platform oversight all connect through the same model.",
    icon: Globe,
  },
] as const;

export default async function HomePage() {
  const session = await getCurrentSession();

  if (session) {
    redirect(getPostSignInPath(session.user.role));
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/30 bg-[hsl(var(--surface-lowest))]/80 backdrop-blur-[12px]">
        <nav className="page-shell flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-strong)))] text-sm font-bold text-white shadow-panel">
              HP
            </span>
            <div>
              <div className="text-lg font-semibold tracking-[-0.02em] text-foreground">
                Human Pulse
              </div>
              <div className="section-label">Commerce Operating System</div>
            </div>
          </Link>
          <div className="hidden items-center gap-2 sm:flex">
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/sign-up">Create Business</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={"/shop" as Route}>Browse Store</Link>
            </Button>
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Start</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="page-shell flex-1 space-y-20 py-8 sm:py-10 lg:py-12">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-7">
            <div className="section-label">Operational transparency for modern retail</div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-foreground sm:text-6xl lg:text-7xl">
                Run storefront, POS, procurement, and analytics from{" "}
                <span className="text-primary">one platform</span>
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Customer ordering, checkout, inventory, supplier procurement, and owner analytics -
                unified on a single operational data layer built for real retail teams.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Create Business
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={"/marketplace" as Route}>Explore Marketplace</Link>
              </Button>
            </div>
          </div>

          <div className="surface-shell rounded-[32px] p-6 sm:p-7">
            <div className="section-label">Operational snapshot</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="data-row">
                <div className="text-4xl font-semibold tracking-[-0.04em] text-foreground">3</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Connected portals for retail, suppliers, and customers.
                </p>
              </div>
              <div className="data-row">
                <div className="text-4xl font-semibold tracking-[-0.04em] text-foreground">1</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Shared commerce model for products, orders, stock, and fulfillment.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="data-row flex items-start gap-3">
                <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BarChart3 className="size-5" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Operator-grade dashboards</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Surface checkout activity, low stock, procurement health, and system status
                    without leaving the platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="space-y-2">
            <div className="section-label">Portal architecture</div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Three portals, one connected commerce system
            </h2>
            <p className="max-w-3xl text-base text-muted-foreground">
              Customers browse and buy, retail teams operate, and suppliers fulfill - all from
              coordinated surfaces built on the same inventory and order model.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <Link key={portal.href} href={portal.href} className="group">
                  <div className="gradient-panel flex h-full flex-col rounded-[26px] p-8">
                    <div className="mb-6 flex size-14 items-center justify-center rounded-[18px] bg-[hsl(var(--surface-high))] text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-semibold tracking-[-0.03em]">{portal.title}</h3>
                    <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                      {portal.description}
                    </p>
                    <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-foreground">
                      {portal.cta}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="surface-shell rounded-[32px] p-8 sm:p-10">
          <div className="space-y-2">
            <div className="section-label">Capability model</div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Built for real retail operations
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {capabilityCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="data-row h-full">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-[18px] bg-[hsl(var(--surface-high))] text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-[-0.02em]">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/30 bg-[hsl(var(--surface-high))]/45">
        <div className="page-shell py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="text-lg font-semibold tracking-[-0.02em] text-foreground">
                Human Pulse
              </span>
              <p className="mt-3 text-sm text-muted-foreground">
                Commerce operating system for modern retail businesses.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground">Portals</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href={"/shop" as Route} className="transition-colors hover:text-foreground">
                    Shop
                  </Link>
                </li>
                <li>
                  <Link href="/sign-in" className="transition-colors hover:text-foreground">
                    Retail Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href={"/supplier/sign-up" as Route}
                    className="transition-colors hover:text-foreground"
                  >
                    Supplier Portal
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground">Account</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/sign-in" className="transition-colors hover:text-foreground">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/sign-up" className="transition-colors hover:text-foreground">
                    Create Business
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground">Resources</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="transition-colors hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="transition-colors hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href={"/marketplace" as Route}
                    className="transition-colors hover:text-foreground"
                  >
                    Marketplace
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-border/30 pt-6 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Human Pulse. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
