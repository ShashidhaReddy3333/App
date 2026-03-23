import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Building2,
  Globe2,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCanonicalPath } from "@/lib/public-metadata";
import { getCurrentRequestOrigin, getPortalAbsoluteUrl } from "@/lib/portal";

export const metadata: Metadata = {
  title: "Human Pulse | Connected Commerce Ecosystem",
  description:
    "Human Pulse connects customer demand, retailer operations, and supplier fulfillment through separate purpose-built portals.",
  alternates: {
    canonical: getCanonicalPath("/"),
  },
};

const portalCards = [
  {
    portal: "shop" as const,
    title: "Customer Portal",
    description:
      "Browse, shop, place orders, and track purchases through the Human Pulse customer experience.",
    cta: "Open Customer Portal",
    icon: ShoppingBag,
  },
  {
    portal: "retail" as const,
    title: "Retailer Portal",
    description:
      "Run checkout, inventory, POS, orders, reports, and staff operations in a retailer-only workspace.",
    cta: "Open Retailer Portal",
    icon: Store,
  },
  {
    portal: "supply" as const,
    title: "Supplier Portal",
    description:
      "Manage wholesale catalog, retailer purchase orders, and fulfillment updates in a supplier-only portal.",
    cta: "Open Supplier Portal",
    icon: Truck,
  },
] as const;

const ecosystemBlocks = [
  {
    title: "Three distinct portals",
    description:
      "Customers, retailers, and suppliers each get their own homepage, navigation, auth flow, and messaging.",
    icon: Globe2,
  },
  {
    title: "One connected model",
    description:
      "Catalog, inventory, order, and fulfillment data stay aligned without forcing every role into one generic interface.",
    icon: Boxes,
  },
  {
    title: "Operational trust",
    description:
      "Human Pulse keeps role-based access, session handling, and portal boundaries explicit as the ecosystem scales.",
    icon: ShieldCheck,
  },
] as const;

export default async function HomePage() {
  const origin = await getCurrentRequestOrigin();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/30 bg-[hsl(var(--surface-lowest))]/85 backdrop-blur-[14px]">
        <nav className="page-shell flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-strong)))] text-sm font-bold text-white shadow-panel">
              HP
            </span>
            <div>
              <div className="text-lg font-semibold tracking-[-0.02em] text-foreground">
                Human Pulse
              </div>
              <div className="section-label">Connected Commerce Ecosystem</div>
            </div>
          </Link>
          <div className="hidden items-center gap-2 sm:flex">
            <Button asChild variant="ghost" size="sm">
              <a href="#platform">Platform</a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href="#portals">Portals</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="#portals">Choose Portal</a>
            </Button>
          </div>
        </nav>
      </header>

      <main className="page-shell space-y-20 py-10 sm:py-12">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <div className="section-label">Commerce, clearly separated</div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-foreground sm:text-6xl lg:text-7xl">
                Human Pulse is a connected business ecosystem, not one generic app for everyone.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                The Human Pulse brand site introduces the platform. Customers, retailers, and
                suppliers each continue into their own portal with purpose-built navigation,
                messaging, and access control.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="#portals">
                  Explore Portals
                  <ArrowRight className="ml-1 size-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#platform">See Ecosystem Model</a>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {portalCards.map((portal) => (
                <a
                  key={portal.portal}
                  href={getPortalAbsoluteUrl(portal.portal, "/", origin)}
                  className="rounded-full border border-border/40 px-4 py-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {portal.title}
                </a>
              ))}
            </div>
          </div>

          <div className="surface-shell rounded-[32px] p-7">
            <div className="section-label">Ecosystem model</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="data-row">
                <div className="text-4xl font-semibold tracking-[-0.04em] text-foreground">3</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Purpose-built portals for customer, retailer, and supplier experiences.
                </p>
              </div>
              <div className="data-row">
                <div className="text-4xl font-semibold tracking-[-0.04em] text-foreground">1</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Shared commerce foundation for catalog, inventory, orders, and fulfillment.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="data-row flex items-start gap-3">
                <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Brand hub on the main domain</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The apex domain focuses on platform story, business value, and routing users to
                    the right portal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="space-y-6">
          <div className="space-y-2">
            <div className="section-label">Platform vision</div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              One business ecosystem, three role-specific portal experiences
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {ecosystemBlocks.map((block) => {
              const Icon = block.icon;
              return (
                <Card key={block.title} className="gradient-panel">
                  <CardHeader>
                    <div className="mb-3 flex size-12 items-center justify-center rounded-[18px] bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle>{block.title}</CardTitle>
                    <CardDescription>{block.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="portals" className="space-y-6">
          <div className="space-y-2">
            <div className="section-label">Portal launcher</div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Enter the right Human Pulse portal
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {portalCards.map((portal) => {
              const Icon = portal.icon;
              return (
                <a
                  key={portal.portal}
                  href={getPortalAbsoluteUrl(portal.portal, "/", origin)}
                  className="group"
                >
                  <Card className="gradient-panel h-full">
                    <CardHeader>
                      <div className="mb-3 flex size-12 items-center justify-center rounded-[18px] bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </div>
                      <CardTitle>{portal.title}</CardTitle>
                      <CardDescription>{portal.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center gap-1 text-sm font-semibold text-foreground">
                      {portal.cta}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </CardContent>
                  </Card>
                </a>
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
                Brand hub for the customer, retailer, and supplier commerce ecosystem.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground">Portals</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href={getPortalAbsoluteUrl("shop", "/", origin)}
                    className="transition-colors hover:text-foreground"
                  >
                    Customer Portal
                  </a>
                </li>
                <li>
                  <a
                    href={getPortalAbsoluteUrl("retail", "/", origin)}
                    className="transition-colors hover:text-foreground"
                  >
                    Retailer Portal
                  </a>
                </li>
                <li>
                  <a
                    href={getPortalAbsoluteUrl("supply", "/", origin)}
                    className="transition-colors hover:text-foreground"
                  >
                    Supplier Portal
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground">Company</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#platform" className="transition-colors hover:text-foreground">
                    Platform
                  </a>
                </li>
                <li>
                  <a href="#portals" className="transition-colors hover:text-foreground">
                    Portal Overview
                  </a>
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
