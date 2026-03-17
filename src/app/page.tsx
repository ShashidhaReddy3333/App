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
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold tracking-tight">Human Pulse</span>
          </Link>
          <div className="hidden items-center gap-2 sm:flex">
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
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

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px]" />
            <div className="absolute right-1/4 top-20 h-[400px] w-[400px] rounded-full bg-accent/40 blur-[100px]" />
            <div className="absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-secondary/60 blur-[100px]" />
          </div>

          <div className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28 lg:px-8 lg:pt-36">
            <div className="mx-auto max-w-3xl text-center">
              <div className="animate-fade-in-up inline-flex rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                Commerce Operating System
              </div>
              <h1 className="animate-fade-in-up stagger-1 mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Run your entire retail business from{" "}
                <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                  one platform
                </span>
              </h1>
              <p className="animate-fade-in-up stagger-2 mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Customer ordering, POS checkout, inventory management, supplier procurement,
                and owner analytics — unified on a single operational data layer.
              </p>
              <div className="animate-fade-in-up stagger-3 mt-10 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/sign-up">
                    Create Business
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href={"/shop" as Route}>Browse Store</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="animate-fade-in-up stagger-3 mb-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Three portals, one system
            </h2>
            <p className="mt-2 text-muted-foreground">
              Choose your entry point into the Human Pulse ecosystem.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link href={"/shop" as Route} className="group">
              <div className="animate-fade-in-up stagger-1 gradient-panel flex h-full flex-col rounded-3xl p-8 transition-all duration-200 hover:-translate-y-1">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight">Shop</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">
                  Browse products, place orders, and track deliveries as a customer in any connected store.
                </p>
                <div className="mt-5 flex items-center gap-1 text-sm font-medium text-primary">
                  Browse Store
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            <Link href="/sign-in" className="group">
              <div className="animate-fade-in-up stagger-2 gradient-panel flex h-full flex-col rounded-3xl p-8 transition-all duration-200 hover:-translate-y-1">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                  <Store className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight">Retail</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">
                  Manage POS checkout, inventory, staff roles, refunds, and real-time owner dashboards.
                </p>
                <div className="mt-5 flex items-center gap-1 text-sm font-medium text-emerald-600">
                  Open Dashboard
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            <Link href={"/supplier/sign-up" as Route} className="group">
              <div className="animate-fade-in-up stagger-3 gradient-panel flex h-full flex-col rounded-3xl p-8 transition-all duration-200 hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 transition-colors group-hover:bg-sky-500 group-hover:text-white">
                  <Truck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight">Supply</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">
                  Publish wholesale catalogs, fulfill purchase orders, and manage goods delivery as a supplier.
                </p>
                <div className="mt-5 flex items-center gap-1 text-sm font-medium text-sky-600">
                  Become a Supplier
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>
        </section>

        <section className="border-t border-border/50 bg-white/40">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="animate-fade-in-up mb-12 text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Built for real retail operations
              </h2>
              <p className="mt-2 text-muted-foreground">
                Everything you need, nothing you don't.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="animate-fade-in-up stagger-1 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">Real-time Inventory</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Shared ledger updated transactionally across online and in-store channels.
                </p>
              </div>
              <div className="animate-fade-in-up stagger-2 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">Role-based Access</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Customer, cashier, manager, supplier, owner, and staff permissions built in.
                </p>
              </div>
              <div className="animate-fade-in-up stagger-3 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">Owner Analytics</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Track low stock, reorder gaps, sales trends, and session security in one dashboard.
                </p>
              </div>
              <div className="animate-fade-in-up stagger-4 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">Supplier Network</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Wholesale catalogs, purchase orders, and goods receiving in a unified workflow.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Zap className="h-4 w-4" />
                </div>
                <span className="text-lg font-semibold">Human Pulse</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Commerce operating system for modern retail businesses.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold">Portals</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href={"/shop" as Route} className="hover:text-foreground transition-colors">
                    Shop
                  </Link>
                </li>
                <li>
                  <Link href="/sign-in" className="hover:text-foreground transition-colors">
                    Retail Dashboard
                  </Link>
                </li>
                <li>
                  <Link href={"/supplier/sign-up" as Route} className="hover:text-foreground transition-colors">
                    Supplier Portal
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold">Account</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/sign-in" className="hover:text-foreground transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/sign-up" className="hover:text-foreground transition-colors">
                    Create Business
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold">Connect</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <span className="cursor-default">Twitter</span>
                </li>
                <li>
                  <span className="cursor-default">LinkedIn</span>
                </li>
                <li>
                  <span className="cursor-default">GitHub</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-border/50 pt-6 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Human Pulse. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
