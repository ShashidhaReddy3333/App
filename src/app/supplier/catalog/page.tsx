import { SupplierProductForm } from "@/components/forms/supplier-product-form";
import { SupplierShell } from "@/components/supplier-shell";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="grid gap-4">
          {supplierData.supplierProducts.length === 0 ? (
            <EmptyState title="No wholesale products yet" description="Publish your first wholesale product to start receiving purchase orders." />
          ) : null}
          {supplierData.supplierProducts.map((product) => (
            <Card key={product.id} className="gradient-panel">
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                <div>MOQ: {Number(product.minimumOrderQuantity).toFixed(0)}</div>
                <div>Wholesale: ${Number(product.wholesalePrice).toFixed(2)}</div>
                <div>Lead time: {product.leadTimeDays} days</div>
                <div>Mapped product: {product.mappedProduct?.name ?? "Not linked"}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SupplierShell>
  );
}
