import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { CustomerShell } from "@/components/customer-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth/session";
import { getCanonicalPath } from "@/lib/public-metadata";
import { getStorefrontData } from "@/lib/services/customer-commerce-query-service";

export const metadata: Metadata = {
  title: "Browse Products | Human Pulse",
  description: "Browse the Human Pulse storefront and place customer pickup or delivery orders.",
  alternates: {
    canonical: getCanonicalPath("/shop"),
  },
};

function toCategorySlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const session = await getCurrentSession();
  const params = await searchParams;
  const storefront = await getStorefrontData();
  const activeCategory = params.category?.trim() ?? "";

  const categoryItems = storefront.categories.map((category) => ({
    label: category,
    slug: toCategorySlug(category),
  }));
  const filteredProducts = activeCategory
    ? storefront.products.filter((product) => toCategorySlug(product.category) === activeCategory)
    : storefront.products;

  const content = (
    <div className="space-y-8">
      <section className="surface-shell rounded-[30px] p-6 sm:p-8">
        <div className="section-label">Storefront</div>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Browse Products</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
          {storefront.available
            ? `Shop from ${storefront.business.businessName} - pickup or delivery from ${storefront.location.name}.`
            : "The storefront is being prepared. Browse the marketplace or create a business to get started."}
        </p>
        {!storefront.available ? (
          <div className="flex flex-wrap gap-3 pt-4">
            <Button asChild>
              <Link href={"/marketplace" as Route}>Browse marketplace</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/sign-up">Create business</Link>
            </Button>
          </div>
        ) : !session || session.user.role !== "customer" ? (
          <div className="flex flex-wrap gap-3 pt-4">
            <Button asChild>
              <Link href={"/customer/sign-up" as Route}>Create customer account</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        ) : null}
      </section>

      {storefront.available ? (
        <section className="flex flex-wrap gap-2">
          <Button asChild variant={activeCategory ? "outline" : "secondary"} size="sm">
            <Link href={"/shop" as Route}>All</Link>
          </Button>
          {categoryItems.map((category) => (
            <Button
              key={category.slug}
              asChild
              variant={activeCategory === category.slug ? "default" : "outline"}
              size="sm"
            >
              <Link href={`/shop?category=${category.slug}` as Route}>{category.label}</Link>
            </Button>
          ))}
        </section>
      ) : null}

      {storefront.available ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="group overflow-hidden">
              <div
                className="aspect-[16/9] w-full bg-[linear-gradient(180deg,hsl(var(--surface-high)),hsl(var(--surface-low)))]"
                role="img"
                aria-label={`Product image for ${product.name}`}
              >
                <div className="flex h-full items-center justify-center">
                  <span className="text-4xl font-bold text-muted-foreground/40">
                    {product.name.charAt(0)}
                  </span>
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="truncate text-base">{product.name}</CardTitle>
                    <CardDescription>{product.category}</CardDescription>
                  </div>
                  <span className="shrink-0 text-base font-semibold text-foreground">
                    ${Number(product.sellingPrice).toFixed(2)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {product.description || "Everyday essentials available for online ordering."}
                </p>
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
                  <AddToCartButton
                    productId={product.id}
                    disabled={product.availableQuantity <= 0}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Storefront coming soon</CardTitle>
            <CardDescription>
              There is no active storefront ready for online ordering yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Browse the public marketplace to discover active businesses, or create a business to
              start selling online through Human Pulse.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href={"/marketplace" as Route}>Open marketplace</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/sign-up">Create business</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {storefront.available && filteredProducts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-sm text-muted-foreground">
            No products found for this category.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );

  if (session?.user.role === "customer") {
    return <CustomerShell customerName={session.user.fullName}>{content}</CustomerShell>;
  }

  return <main className="page-shell py-8">{content}</main>;
}
