import type { Metadata } from "next";
import { ProductForm } from "@/components/forms/product-form";
import { InventoryAdjustmentForm } from "@/components/forms/inventory-adjustment-form";
import { Pagination } from "@/components/pagination";
import { PageHeader } from "@/components/page-header";
import { ProductsTable } from "@/components/products-table";
import { EmptyState } from "@/components/state-card";
import { requirePermission } from "@/lib/auth/guards";
import { listCatalogData } from "@/lib/services/catalog-query-service";
import { toProductOptions, toProductTableRows, toSupplierOptions } from "@/lib/view-models/app";

export const metadata: Metadata = {
  title: "Products | Human Pulse",
};

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await requirePermission("products");
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const data = await listCatalogData(session.user.businessId!, { page, pageSize: 50 });
  const rows = toProductTableRows(data.products);
  const supplierOptions = toSupplierOptions(data.suppliers);
  const productOptions = toProductOptions(data.allProducts);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage the product catalog, opening stock, and inventory adjustments from one workspace."
        breadcrumbs={[{ label: "Products" }]}
      />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {rows.length === 0 ? (
            <EmptyState
              icon="package"
              title="No products yet"
              description="Create the first product on the right to begin tracking inventory and checkout availability."
            />
          ) : (
            <ProductsTable data={rows} />
          )}
          <Pagination
            basePath="/app/products"
            currentPage={data.currentPage}
            totalPages={data.totalPages}
            totalItems={data.totalCount}
          />
        </div>
        <div className="space-y-6">
          <ProductForm locationId={data.location.id} suppliers={supplierOptions} />
          <InventoryAdjustmentForm locationId={data.location.id} products={productOptions} />
        </div>
      </div>
    </div>
  );
}


