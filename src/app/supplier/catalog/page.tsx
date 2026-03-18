import type { Metadata } from "next";
import { Package, DollarSign, Clock, Link2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Wholesale Catalog | Human Pulse",
};

import { SupplierProductForm } from "@/components/forms/supplier-product-form";
import { SupplierShell } from "@/components/supplier-shell";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/guards";
import { listCatalogData } from "@/lib/services/catalog-query-service";
import { listSupplierPortalData } from "@/lib/services/procurement-query-service";
import { toProductOptions } from "@/lib/view-models/app";

export default async function SupplierCatalogPage() {
  const session = await requireRole("supplier", "/sign-in");
  const [supplierData, catalog] = await Promise.all([
    listSupplierPortalData(session.user.id),
    listCatalogData(session.user.businessId!)
  ]);
  const mappedProducts = toProductOptions(catalog.products);

  return (
    <SupplierShell supplierName={supplierData.supplier.name} userName={session.user.fullName}>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SupplierProductForm mappedProducts={mappedProducts} />
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Your Products</h2>
            <p className="text-sm text-muted-foreground">
              {supplierData.supplierProducts.length} item{supplierData.supplierProducts.length !== 1 ? "s" : ""} in your wholesale catalog
            </p>
          </div>
          <div className="grid gap-4">
            {supplierData.supplierProducts.length === 0 ? (
              <EmptyState
                icon="package"
                title="No wholesale products yet"
                description="Publish your first wholesale product to start receiving purchase orders."
              />
            ) : null}
            {supplierData.supplierProducts.map((product) => (
              <Card
                key={product.id}
                className="rounded-xl"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                        <Package className="size-5" />
                      </div>
                      <CardTitle className="text-base">{product.name}</CardTitle>
                    </div>
                    {product.mappedProduct?.name ? (
                      <Badge variant="success" className="shrink-0">
                        <Link2 className="mr-1 size-3" />
                        Linked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0">Not linked</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                    <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1">
                      <Package className="size-3.5 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">MOQ</div>
                        <div className="font-medium">{Number(product.minimumOrderQuantity).toFixed(0)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1">
                      <DollarSign className="size-3.5 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Wholesale</div>
                        <div className="font-medium">${Number(product.wholesalePrice).toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Lead time</div>
                        <div className="font-medium">{product.leadTimeDays} days</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1">
                      <Link2 className="size-3.5 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Mapped to</div>
                        <div className="truncate font-medium">{product.mappedProduct?.name ?? "None"}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </SupplierShell>
  );
}


