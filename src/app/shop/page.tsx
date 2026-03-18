import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

export const metadata: Metadata = {
  title: "Browse Products | Human Pulse",
};

import { AddToCartButton } from "@/components/add-to-cart-button";
import { CustomerShell } from "@/components/customer-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth/session";
import { getStorefrontData } from "@/lib/services/customer-commerce-query-service";

export default async function ShopPage() {
  const session = await getCurrentSession();
  const storefront = await getStorefrontData();

  const allCategories = ["All", ...storefront.categories];

  const content = (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Browse Products</h1>
        <p className="text-muted-foreground">
          Shop from {storefront.business.businessName} — pickup or delivery from {storefront.location.name}.
        </p>
        {!session || session.user.role !== "customer" ? (
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild>
              <Link href={"/customer/sign-up" as Route}>Create customer account</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        ) : null}
      </section>

      <section className="flex flex-wrap gap-2">
        {allCategories.map((category) => (
          <span
            key={category}
            className="cursor-default rounded-full bg-secondary px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/80"
          >
            {category}
          </span>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {storefront.products.map((product) => (
          <Card
            key={product.id}
            className="group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="aspect-[16/9] w-full bg-secondary" role="img" aria-label={`Product image for ${product.name}`}>
              <div className="flex h-full items-center justify-center">
                <span className="text-4xl font-bold text-muted-foreground/40">{product.name.charAt(0)}</span>
              </div>
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="truncate text-base">{product.name}</CardTitle>
                  <CardDescription>{product.category}</CardDescription>
                </div>
                <span className="shrink-0 text-base font-bold text-black">
                  ${Number(product.sellingPrice).toFixed(2)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="line-clamp-2 text-sm text-muted-foreground">{product.description || "Everyday essentials available for online ordering."}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {product.availableQuantity > 0 ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-green-500" />
                      {product.availableQuantity} in stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-red-500" />
                      Out of stock
                    </span>
                  )}
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                <Button asChild variant="outline" className="flex-1">
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


