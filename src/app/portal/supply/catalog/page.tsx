import type { Metadata } from "next";
import type { Route } from "next";
import { Package, DollarSign, Clock, Link2 } from "lucide-react";

import { SupplierProductForm } from "@/components/forms/supplier-product-form";
import { SupplierRelationshipManager } from "@/components/supplier-relationship-manager";
import { SupplierShell } from "@/components/supplier-shell";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/guards";
import { withNoIndex } from "@/lib/public-metadata";
import { listCatalogData } from "@/lib/services/catalog-query-service";
import { listSupplierPortalData } from "@/lib/services/procurement-query-service";
import { toProductOptions } from "@/lib/view-models/app";

export const metadata: Metadata = withNoIndex({
  title: "Wholesale Catalog | Human Pulse",
});

export default async function SupplierCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ relationship?: string }>;
}) {
  const params = await searchParams;
  const session = await requireRole("supplier", "/forbidden" as Route);
  const supplierData = await listSupplierPortalData(session.user.id, {
    relationshipSupplierId: params.relationship,
  });
  const catalog = await listCatalogData(supplierData.defaultBusinessId);
  const mappedProducts = toProductOptions(catalog.products);

  return (
    <SupplierShell
      supplierName={supplierData.supplierOrganization.name}
      userName={session.user.fullName}
    >
      <div className="space-y-6">
        <SupplierRelationshipManager
          basePath="/catalog"
          relationships={supplierData.relationshipSummaries}
          activeRelationshipId={supplierData.activeRelationship.id}
          showingAllRelationships={supplierData.showingAllRelationships}
          description="Choose which retailer relationship you want to publish products into or review all linked catalog items together."
        />

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <SupplierProductForm
            mappedProducts={mappedProducts}
            relationshipLabel={`${supplierData.activeRelationship.name} at ${supplierData.activeRelationship.business.businessName}`}
            supplierId={supplierData.activeRelationship.id}
          />
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Your Products</h2>
              <p className="text-sm text-muted-foreground">
                {supplierData.supplierProducts.length} item
                {supplierData.supplierProducts.length !== 1 ? "s" : ""} in your wholesale catalog
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Managing {supplierData.supplierRelationships.length} retailer relationship
                {supplierData.supplierRelationships.length === 1 ? "" : "s"} from one supplier
                account.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                New wholesale products publish to{" "}
                {supplierData.activeRelationship.business.businessName}.
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
                <Card key={product.id} className="rounded-xl">
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
                        <Badge variant="outline" className="shrink-0">
                          Not linked
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                      <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1">
                        <Package className="size-3.5 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">MOQ</div>
                          <div className="font-medium">
                            {Number(product.minimumOrderQuantity).toFixed(0)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1">
                        <DollarSign className="size-3.5 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Wholesale</div>
                          <div className="font-medium">
                            ${Number(product.wholesalePrice).toFixed(2)}
                          </div>
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
                          <div className="truncate font-medium">
                            {product.mappedProduct?.name ?? "None"}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Retail relationship: {product.supplier.business.businessName}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SupplierShell>
  );
}
