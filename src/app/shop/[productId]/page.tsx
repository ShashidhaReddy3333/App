import Link from "next/link";
import type { Route } from "next";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { CustomerShell } from "@/components/customer-shell";
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
      <Button asChild variant="secondary">
        <Link href={"/shop" as Route}>Back to shop</Link>
      </Button>
      <Card className="gradient-panel">
        <CardHeader>
          <CardTitle className="text-3xl">{product.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="text-sm uppercase tracking-wide text-muted-foreground">{product.category}</div>
            <p className="text-muted-foreground">{product.description || "This product is available through the customer storefront and the store POS."}</p>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div>SKU: {product.sku}</div>
              <div>Unit: {product.unitType}</div>
              <div>Available quantity: {availableQuantity}</div>
            </div>
          </div>
          <div className="space-y-4 rounded-[1.5rem] border bg-white/80 p-6">
            <div className="text-4xl font-semibold">${Number(product.sellingPrice).toFixed(2)}</div>
            <AddToCartButton productId={product.id} disabled={availableQuantity <= 0} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (session?.user.role === "customer") {
    return <CustomerShell customerName={session.user.fullName}>{content}</CustomerShell>;
  }

  return <main className="page-shell py-8">{content}</main>;
}
