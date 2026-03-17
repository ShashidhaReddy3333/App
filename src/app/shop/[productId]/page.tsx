import Link from "next/link";
import type { Route } from "next";
import { ChevronRight } from "lucide-react";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { CustomerShell } from "@/components/customer-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth/session";
import { getStorefrontProduct } from "@/lib/services/customer-commerce-query-service";

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const session = await getCurrentSession();
  const { product, availableQuantity } = await getStorefrontProduct(productId);

  const content = (
    <div className="space-y-6">
      <nav className="animate-fade-in flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={"/shop" as Route} className="transition hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link href={"/shop" as Route} className="transition hover:text-foreground">Shop</Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">{product.name}</span>
      </nav>

      <div className="animate-fade-in-up grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[2rem] border bg-gradient-to-br from-amber-100 via-orange-50 to-amber-200/60">
          <div className="flex aspect-square items-center justify-center">
            <span className="text-8xl font-bold text-amber-300/50">{product.name.charAt(0)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="gradient-panel flex-1">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{product.category}</Badge>
                {availableQuantity > 0 ? (
                  <Badge variant="success">In Stock</Badge>
                ) : (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
              </div>
              <CardTitle className="text-3xl">{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">{product.description || "This product is available through the customer storefront and the store POS."}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border bg-muted/30 p-3 text-center">
                  <div className="text-xs text-muted-foreground">SKU</div>
                  <div className="mt-1 text-sm font-medium">{product.sku}</div>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3 text-center">
                  <div className="text-xs text-muted-foreground">Unit</div>
                  <div className="mt-1 text-sm font-medium">{product.unitType}</div>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3 text-center">
                  <div className="text-xs text-muted-foreground">Available</div>
                  <div className="mt-1 text-sm font-medium">{availableQuantity}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4 rounded-[1.5rem] border bg-white/80 p-6 shadow-sm">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Price</div>
              <div className="text-5xl font-bold tracking-tight">${Number(product.sellingPrice).toFixed(2)}</div>
            </div>
            <AddToCartButton productId={product.id} disabled={availableQuantity <= 0} />
          </div>
        </div>
      </div>
    </div>
  );

  if (session?.user.role === "customer") {
    return <CustomerShell customerName={session.user.fullName}>{content}</CustomerShell>;
  }

  return <main className="page-shell py-8">{content}</main>;
}
