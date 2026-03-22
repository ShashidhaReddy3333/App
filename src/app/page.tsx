import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { getPostSignInPath } from "@/lib/auth/guards";
import { getCurrentSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  Store,
  Truck,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  Globe,
} from "lucide-react";

export default async function HomePage() {
  const session = await getCurrentSession();

  if (session) {
    redirect(getPostSignInPath(session.user.role));
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-50 bg-black text-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">Human Pulse</span>
          </Link>
          <div className="hidden items-center gap-2 sm:flex">
            <Button asChild variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
              <Link href="/sign-up">Create Business</Link>
            </Button>
            <Button asChild size="sm" className="bg-white text-black hover:bg-white/90">
              <Link href={"/shop" as Route}>Browse Store</Link>
            </Button>
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <Button asChild variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="bg-white text-black hover:bg-white/90">
              <Link href="/sign-up">Start</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="bg-black text-white">
          <div className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28 lg:px-8 lg:pt-36">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white">
                Commerce Operating System
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Run your entire retail business from{" "}
                <span className="text-uber-green">one platform</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
                Customer ordering, POS checkout, inventory management, supplier procurement,
                and owner analytics — unified on a single operational data layer.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
                  <Link href="/sign-up">
                    Create Business
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  <Link href={"/shop" as Route}>Browse Store</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Three portals, one system
            </h2>
            <p className="mt-2 text-muted-foreground">
              Choose your entry point into the Human Pulse ecosystem.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link href={"/shop" as Route} className="group">
              <div className="flex h-full flex-col rounded-xl border border-border bg-white p-8 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Shop</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">
                  Browse products, place orders, and track deliveries as a customer in any connected store.
                </p>
                <div className="mt-5 flex items-center gap-1 text-sm font-medium text-foreground">
                  Browse Store
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            <Link href="/sign-in" className="group">
              <div className="flex h-full flex-col rounded-xl border border-border bg-white p-8 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
                  <Store className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Retail</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">
                  Manage POS checkout, inventory, staff roles, refunds, and real-time owner dashboards.
                </p>
                <div className="mt-5 flex items-center gap-1 text-sm font-medium text-foreground">
                  Open Dashboard
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            <Link href={"/supplier/sign-up" as Route} className="group">
              <div className="flex h-full flex-col rounded-xl border border-border bg-white p-8 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 sm:col-span-2 lg:col-span-1">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
                  <Truck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Supply</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">
                  Publish wholesale catalogs, fulfill purchase orders, and manage goods delivery as a supplier.
                </p>
                <div className="mt-5 flex items-center gap-1 text-sm font-medium text-foreground">
                  Become a Supplier
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>
        </section>

        <section className="border-t border-border bg-secondary">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Built for real retail operations
              </h2>
              <p className="mt-2 text-muted-foreground">
                Everything you need, nothing you don't.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white text-foreground shadow-sm">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="font-bold">Real-time Inventory</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Shared ledger updated transactionally across online and in-store channels.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white text-foreground shadow-sm">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="font-bold">Role-based Access</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Customer, cashier, manager, supplier, owner, and staff permissions built in.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white text-foreground shadow-sm">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="font-bold">Owner Analytics</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Track low stock, reorder gaps, sales trends, and session security in one dashboard.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white text-foreground shadow-sm">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="font-bold">Supplier Network</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Wholesale catalogs, purchase orders, and goods receiving in a unified workflow.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="text-lg font-bold">Human Pulse</span>
              <p className="mt-3 text-sm text-white/50">
                Commerce operating system for modern retail businesses.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold">Portals</h4>
              <ul className="mt-3 space-y-2 text-sm text-white/50">
                <li>
                  <Link href={"/shop" as Route} className="hover:text-white transition-colors">
                    Shop
                  </Link>
                </li>
                <li>
                  <Link href="/sign-in" className="hover:text-white transition-colors">
                    Retail Dashboard
                  </Link>
                </li>
                <li>
                  <Link href={"/supplier/sign-up" as Route} className="hover:text-white transition-colors">
                    Supplier Portal
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold">Account</h4>
              <ul className="mt-3 space-y-2 text-sm text-white/50">
                <li>
                  <Link href="/sign-in" className="hover:text-white transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/sign-up" className="hover:text-white transition-colors">
                    Create Business
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold">Connect</h4>
              <ul className="mt-3 space-y-2 text-sm text-white/50">
                <li>
                  <a href="#" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href="#" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-white/40">
            &copy; {new Date().getFullYear()} Human Pulse. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
