import { ExportButton } from "@/components/export-button";
import { ProductForm } from "@/components/forms/product-form";
import { InventoryAdjustmentForm } from "@/components/forms/inventory-adjustment-form";
import { PageHeader } from "@/components/page-header";
import { ProductsTable } from "@/components/products-table";
import { EmptyState } from "@/components/state-card";
import { requirePermission } from "@/lib/auth/guards";
import { listCatalogData } from "@/lib/services/catalog-query-service";
import { toProductOptions, toProductTableRows, toSupplierOptions } from "@/lib/view-models/app";

export default async function ProductsPage() {
  const session = await requirePermission("products");
  const data = await listCatalogData(session.user.businessId!);
  const rows = toProductTableRows(data.products);
  const supplierOptions = toSupplierOptions(data.suppliers);
  const productOptions = toProductOptions(data.products);

  const exportHeaders = ["Name", "SKU", "Category", "Supplier", "Selling Price", "Available Qty", "Reorder Qty"];
  const exportRows = rows.map((row: (typeof rows)[number]) => [
    row.name,
    row.sku,
    row.category ?? "",
    row.supplierName,
    row.sellingPrice,
    row.availableQuantity,
    row.reorderQuantity
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage the product catalog, opening stock, and inventory adjustments from one workspace."
        breadcrumbs={[{ label: "Products" }]}
        actions={<ExportButton filename="products.csv" headers={exportHeaders} rows={exportRows} />}
      />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6 animate-fade-in-up stagger-1">
          {rows.length === 0 ? (
            <EmptyState
              icon="package"
              title="No products yet"
              description="Create the first product on the right to begin tracking inventory and checkout availability."
            />
          ) : (
            <ProductsTable data={rows} />
          )}
        </div>
        <div className="space-y-6 animate-fade-in-up stagger-2">
          <ProductForm locationId={data.location.id} suppliers={supplierOptions} />
          <InventoryAdjustmentForm locationId={data.location.id} products={productOptions} />
        </div>
      </div>
    </div>
  );
}
