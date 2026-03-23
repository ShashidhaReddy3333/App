import { ExportButton } from "@/components/export-button";
import { LocationSwitcher } from "@/components/location-switcher";
import { PageHeader } from "@/components/page-header";
import { SalesList } from "@/components/sales-list";
import { EmptyState } from "@/components/state-card";
import { requirePermission } from "@/lib/auth/guards";
import { ACTIVE_BUSINESS_LOCATION_COOKIE } from "@/lib/location-preferences";
import { getBusinessLocationContext } from "@/lib/server/location-context";
import { listSales } from "@/lib/services/sales-query-service";
import { toSalesListItems } from "@/lib/view-models/app";

export default async function SalesPage() {
  const session = await requirePermission("sales");
  const { location, locations } = await getBusinessLocationContext(session.user.businessId!);
  const sales = await listSales(session.user.businessId!, { locationId: location.id });
  const items = toSalesListItems(sales.items);

  const exportHeaders = ["Receipt #", "Cashier", "Total", "Amount Paid", "Status", "Completed At"];
  const exportRows = items.map((item: (typeof items)[number]) => [
    item.receiptNumber,
    item.cashierName,
    item.totalAmount,
    item.amountPaid,
    item.statusLabel,
    item.completedAtLabel,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales history"
        description={`Review completed, pending, and refunded sales with receipt retrieval for ${location.name}.`}
        breadcrumbs={[{ label: "Sales" }]}
        actions={
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <LocationSwitcher
              label="Sales location"
              cookieName={ACTIVE_BUSINESS_LOCATION_COOKIE}
              locations={locations}
              value={location.id}
            />
            <ExportButton filename="sales.csv" headers={exportHeaders} rows={exportRows} />
          </div>
        }
      />
      {items.length === 0 ? (
        <EmptyState
          illustration="receipt"
          title="No sales yet"
          description="Completed and pending sales will appear here after the first checkout is created."
        />
      ) : (
        <SalesList items={items} />
      )}
    </div>
  );
}
