import { LocationSwitcher } from "@/components/location-switcher";
import { PageHeader } from "@/components/page-header";
import { ProductsWorkspace } from "@/components/products-workspace";
import { requirePermission } from "@/lib/auth/guards";
import { ACTIVE_BUSINESS_LOCATION_COOKIE } from "@/lib/location-preferences";
import { getBusinessLocationContext } from "@/lib/server/location-context";
import { listCatalogData } from "@/lib/services/catalog-query-service";
import { toProductOptions, toProductTableRows, toSupplierOptions } from "@/lib/view-models/app";

export default async function ProductsPage() {
  const session = await requirePermission("products");
  const { location, locations } = await getBusinessLocationContext(session.user.businessId!);
  const data = await listCatalogData(session.user.businessId!, { locationId: location.id });
  const rows = toProductTableRows(data.products);
  const supplierOptions = toSupplierOptions(data.suppliers);
  const productOptions = toProductOptions(data.products);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description={`Manage the product catalog, opening stock, inventory adjustments, and transfers for ${location.name}.`}
        breadcrumbs={[{ label: "Products" }]}
        actions={
          <LocationSwitcher
            label="Catalog location"
            cookieName={ACTIVE_BUSINESS_LOCATION_COOKIE}
            locations={locations}
            value={location.id}
          />
        }
      />
      <ProductsWorkspace
        locationId={data.location.id}
        locationName={data.location.name}
        locations={locations.map((entry) => ({ id: entry.id, name: entry.name }))}
        rows={rows}
        supplierOptions={supplierOptions}
        productOptions={productOptions}
        emailVerified={!!session.user.emailVerifiedAt}
      />
    </div>
  );
}
