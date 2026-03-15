import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { listSales } from "@/lib/services/sales-query-service";
import { toSalesListItems } from "@/lib/view-models/app";

export default async function SalesPage() {
  const session = await requirePermission("sales");
  const sales = await listSales(session.user.businessId!);
  const items = toSalesListItems(sales);

  return (
    <div className="space-y-6">
      <PageHeader title="Sales history" description="Review completed, pending, and refunded sales with receipt retrieval." />
      <div className="grid gap-4">
        {items.length === 0 ? (
          <EmptyState title="No sales yet" description="Completed and pending sales will appear here after the first checkout is created." />
        ) : null}
        {items.map((sale) => (
          <Link key={sale.id} href={`/app/sales/${sale.id}`}>
            <Card className="gradient-panel transition hover:border-primary/40">
              <CardHeader>
                <CardTitle>{sale.receiptNumber}</CardTitle>
                <CardDescription>{sale.statusLabel}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-4">
                <div>Total: ${sale.totalAmount}</div>
                <div>Paid: ${sale.amountPaid}</div>
                <div>Cashier: {sale.cashierName}</div>
                <div>{sale.completedAtLabel}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
