import Link from "next/link";
import type { Route } from "next";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { CustomerShell } from "@/components/customer-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth/session";
import { getStorefrontData } from "@/lib/services/customer-commerce-query-service";

export default async function ShopPage() {
  const session = await getCurrentSession();
  const storefront = await getStorefrontData();

  const content = (
    <div className="space-y-8">
      <section className="animate-fade-in grid gap-6 rounded-[2rem] border bg-white/80 p-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Badge>Customer Storefront</Badge>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">{storefront.business.businessName} online ordering</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Browse the live catalog, add items to your cart, and choose pickup or delivery from {storefront.location.name}.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {storefront.categories.map((category) => (
              <span
                key={category}
                className="cursor-default rounded-full border border-amber-200/60 bg-amber-50 px-3.5 py-1.5 text-sm font-medium text-amber-700 transition-all hover:border-amber-300 hover:bg-amber-100 hover:shadow-sm"
              >
                {category}
              </span>
            ))}
          </div>
          {!session || session.user.role !== "customer" ? (
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild>
                <Link href={"/customer/sign-up" as Route}>Create customer account</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>
          ) : null}
        </div>
        <Card className="gradient-panel">
          <CardHeader>
            <CardTitle>Phase 1 storefront</CardTitle>
            <CardDescription>One retailer, responsive web ordering, and shared inventory with the in-store POS.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>Pickup and delivery-ready order flow.</div>
            <div>Stock comes from the same inventory balance used by the cashier checkout.</div>
            <div>Orders appear instantly in the retailer operations workspace.</div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {storefront.products.map((product, index) => {
          const staggerClass = `stagger-${(index % 5) + 1}`;
          return (
            <Card
              key={product.id}
              className={`animate-fade-in-up ${staggerClass} gradient-panel group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
            >
              <div className="aspect-[16/9] w-full bg-gradient-to-br from-amber-100 via-orange-50 to-amber-200/60">
                <div className="flex h-full items-center justify-center">
                  <span className="text-4xl font-bold text-amber-300/60">{product.name.charAt(0)}</span>
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="truncate text-base">{product.name}</CardTitle>
                    <CardDescription>{product.category}</CardDescription>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-base font-bold text-amber-700">
                    ${Number(product.sellingPrice).toFixed(2)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <p className="line-clamp-2 text-sm text-muted-foreground">{product.description || "Everyday essentials available for online ordering."}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {product.availableQuantity > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-green-500" />
                        {product.availableQuantity} in stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-red-400" />
                        Out of stock
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button asChild variant="secondary" className="flex-1">
                    <Link href={`/shop/${product.id}` as Route}>View</Link>
                  </Button>
                  <AddToCartButton productId={product.id} disabled={product.availableQuantity <= 0} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );

  if (session?.user.role === "customer") {
    return <CustomerShell customerName={session.user.fullName}>{content}</CustomerShell>;
  }

  return <main className="page-shell py-8">{content}</main>;
}
