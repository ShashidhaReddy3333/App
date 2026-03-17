import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { getPostSignInPath } from "@/lib/auth/guards";
import { getCurrentSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SHOP_URL = process.env.NEXT_PUBLIC_SHOP_URL ?? "/shop";
const RETAIL_URL = process.env.NEXT_PUBLIC_RETAIL_URL ?? "/sign-in";
const SUPPLY_URL = process.env.NEXT_PUBLIC_SUPPLY_URL ?? "/supplier/sign-up";

export default async function HomePage() {
  const session = await getCurrentSession();

  if (session) {
    redirect(getPostSignInPath(session.user.role));
  }

  return (
    <main className="page-shell flex min-h-screen items-center">
      <div className="w-full space-y-12">
        {/* Hero */}
        <section className="space-y-6 text-center">
          <div className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
            Commerce Operating System
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            One platform for customers, retailers, and suppliers.
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Order from your favorite stores, manage your retail business, or fulfill wholesale orders — all connected on a single operational backbone.
          </p>
        </section>

        {/* Portal cards */}
        <section className="grid gap-6 md:grid-cols-3">
          {/* Customer / Shop */}
          <Card className="gradient-panel flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Shop</CardTitle>
              <CardDescription>For customers</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-6">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Browse products from local retailers</li>
                <li>Add items to your cart and checkout online</li>
                <li>Choose pickup or delivery</li>
                <li>Track your order history</li>
              </ul>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href={SHOP_URL as Route}>Browse Store</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={"/customer/sign-up" as Route}>Create Account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Retailer / Management */}
          <Card className="gradient-panel flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Retail</CardTitle>
              <CardDescription>For retailers &amp; management</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-6">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>POS checkout and in-store sales</li>
                <li>Receive and fulfill online orders</li>
                <li>Manage products, menu, and inventory</li>
                <li>Order from suppliers and track procurement</li>
                <li>View sales reports and analytics</li>
              </ul>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href={RETAIL_URL as Route}>Sign In</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/sign-up">Create Business</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Supplier */}
          <Card className="gradient-panel flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Supply</CardTitle>
              <CardDescription>For suppliers</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-6">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Receive purchase orders from retailers</li>
                <li>Publish and manage your wholesale catalog</li>
                <li>Update order fulfillment status</li>
                <li>Track your inventory and lead times</li>
              </ul>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href={SUPPLY_URL as Route}>Become a Supplier</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Already have an account */}
        <section className="text-center">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-primary underline underline-offset-4">
              Sign in here
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
