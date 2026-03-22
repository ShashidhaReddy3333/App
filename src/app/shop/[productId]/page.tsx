import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft } from "lucide-react";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { CustomerShell } from "@/components/customer-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth/session";
import { getStorefrontProduct } from "@/lib/services/customer-commerce-query-service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}): Promise<Metadata> {
  const { productId } = await params;

  try {
    const { product } = await getStorefrontProduct(productId);
    return {
      title: `${product.name} | Human Pulse`,
    };
  } catch {
    return {
      title: "Product Details | Human Pulse",
    };
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const session = await getCurrentSession();
  const { product, availableQuantity } = await getStorefrontProduct(productId);

  const content = (
    <div className="space-y-6">
      <Link
        href={"/shop" as Route}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to shop
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="overflow-hidden rounded-xl bg-secondary">
          <div
            className="flex aspect-video items-center justify-center bg-[linear-gradient(180deg,hsl(var(--surface-high)),hsl(var(--surface-low)))]"
            role="img"
            aria-label={`Product image for ${product.name}`}
          >
            <span className="text-8xl font-bold text-muted-foreground/30">
              {product.name.charAt(0)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{product.category}</span>
              <span className="text-border">|</span>
              {availableQuantity > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-green-500" />
                  In Stock ({availableQuantity})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-red-500" />
                  Out of Stock
                </span>
              )}
            </div>
            <h1 className="text-4xl font-semibold tracking-[-0.04em]">{product.name}</h1>
            <p className="text-3xl font-semibold tracking-[-0.04em]">
              ${Number(product.sellingPrice).toFixed(2)}
            </p>
            <p className="text-muted-foreground">
              {product.description ||
                "This product is available through the customer storefront and the store POS."}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-[18px] bg-[hsl(var(--surface-low))] p-3 text-center">
                  <div className="text-xs text-muted-foreground">SKU</div>
                  <div className="mt-1 text-sm font-medium">{product.sku}</div>
                </div>
                <div className="rounded-[18px] bg-[hsl(var(--surface-low))] p-3 text-center">
                  <div className="text-xs text-muted-foreground">Unit</div>
                  <div className="mt-1 text-sm font-medium">{product.unitType}</div>
                </div>
                <div className="rounded-[18px] bg-[hsl(var(--surface-low))] p-3 text-center">
                  <div className="text-xs text-muted-foreground">Available</div>
                  <div className="mt-1 text-sm font-medium">{availableQuantity}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <AddToCartButton
            productId={product.id}
            disabled={availableQuantity <= 0}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );

  if (session?.user.role === "customer") {
    return <CustomerShell customerName={session.user.fullName}>{content}</CustomerShell>;
  }

  return <main className="page-shell py-8">{content}</main>;
}
