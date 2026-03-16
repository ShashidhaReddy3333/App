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
      <section className="grid gap-6 rounded-[2rem] border bg-white/80 p-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Badge>Customer Storefront</Badge>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">{storefront.business.businessName} online ordering</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Browse the live catalog, add items to your cart, and choose pickup or delivery from {storefront.location.name}.
          </p>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {storefront.categories.map((category) => (
              <span key={category} className="rounded-full border bg-muted px-3 py-1">
                {category}
              </span>
            ))}
          </div>
          {!session || session.user.role !== "customer" ? (
            <div className="flex flex-wrap gap-3">
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {storefront.products.map((product) => (
          <Card key={product.id} className="gradient-panel">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>{product.name}</span>
                <span className="text-base">${Number(product.sellingPrice).toFixed(2)}</span>
              </CardTitle>
              <CardDescription>{product.category}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{product.description || "Everyday essentials available for online ordering."}</p>
              <div className="text-sm text-muted-foreground">Available now: {product.availableQuantity}</div>
              <div className="flex gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/shop/${product.id}` as Route}>View</Link>
                </Button>
                <AddToCartButton productId={product.id} disabled={product.availableQuantity <= 0} />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );

  if (session?.user.role === "customer") {
    return <CustomerShell customerName={session.user.fullName}>{content}</CustomerShell>;
  }

  return <main className="page-shell py-8">{content}</main>;
}
