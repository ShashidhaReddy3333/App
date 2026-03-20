import { ExportButton } from "@/components/export-button";
import { PageHeader } from "@/components/page-header";
import { SalesList } from "@/components/sales-list";
import { EmptyState } from "@/components/state-card";
import { requirePermission } from "@/lib/auth/guards";
import { listSales } from "@/lib/services/sales-query-service";
import { toSalesListItems } from "@/lib/view-models/app";

export default async function SalesPage() {
  const session = await requirePermission("sales");
  const sales = await listSales(session.user.businessId!);
  const items = toSalesListItems(sales);

  const exportHeaders = ["Receipt #", "Cashier", "Total", "Amount Paid", "Status", "Completed At"];
  const exportRows = items.map((item: (typeof items)[number]) => [
    item.receiptNumber,
    item.cashierName,
    item.totalAmount,
    item.amountPaid,
    item.statusLabel,
    item.completedAtLabel
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales history"
        description="Review completed, pending, and refunded sales with receipt retrieval."
        breadcrumbs={[{ label: "Sales" }]}
        actions={<ExportButton filename="sales.csv" headers={exportHeaders} rows={exportRows} />}
      />
      {items.length === 0 ? (
        <EmptyState title="No sales yet" description="Completed and pending sales will appear here after the first checkout is created." />
      ) : (
        <SalesList items={items} />
      )}
    </div>
  );
}
