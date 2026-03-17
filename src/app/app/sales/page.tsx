import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { listSales } from "@/lib/services/sales-query-service";
import { toSalesListItems } from "@/lib/view-models/app";

function getStatusBadgeVariant(status: string): "success" | "warning" | "destructive" | "default" | "secondary" {
  if (status.includes("completed")) return "success";
  if (status.includes("pending")) return "warning";
  if (status.includes("refunded")) return "destructive";
  if (status.includes("cancelled")) return "secondary";
  return "default";
}

export default async function SalesPage() {
  const session = await requirePermission("sales");
  const sales = await listSales(session.user.businessId!);
  const items = toSalesListItems(sales);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales history"
        description="Review completed, pending, and refunded sales with receipt retrieval."
        breadcrumbs={[{ label: "Sales" }]}
      />
      <div className="grid gap-4">
        {items.length === 0 ? (
          <EmptyState title="No sales yet" description="Completed and pending sales will appear here after the first checkout is created." />
        ) : null}
        {items.map((sale, index) => (
          <Link key={sale.id} href={`/app/sales/${sale.id}`}>
            <Card className={`gradient-panel transition-all duration-200 hover:border-primary/40 hover:shadow-md animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>{sale.receiptNumber}</CardTitle>
                  <Badge variant={getStatusBadgeVariant(sale.statusLabel)}>{sale.statusLabel}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-4">
                <div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground/70">Total</span>
                  <div className="font-semibold text-foreground">${sale.totalAmount}</div>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground/70">Paid</span>
                  <div className="font-semibold text-foreground">${sale.amountPaid}</div>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground/70">Cashier</span>
                  <div className="font-medium">{sale.cashierName}</div>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground/70">Date</span>
                  <div className="font-medium">{sale.completedAtLabel}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
