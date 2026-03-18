import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refunds | Human Pulse",
};

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { listSales } from "@/lib/services/sales-query-service";

function getRefundBadgeVariant(status: string): "destructive" | "warning" | "default" {
  if (status.includes("fully")) return "destructive";
  if (status.includes("partially")) return "warning";
  return "default";
}

export default async function RefundsPage() {
  const session = await requirePermission("refunds");
  const sales = await listSales(session.user.businessId!);
  const refunded = sales.items.filter((sale) => sale.status === "refunded_partially" || sale.status === "refunded_fully");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refunds"
        description="Open a sale to create a partial or full refund with explicit stock return behavior."
        breadcrumbs={[{ label: "Refunds" }]}
      />
      <div className="grid gap-4">
        {refunded.length === 0 ? <EmptyState title="No refunds yet" description="Refunded sales will appear here once processed." /> : null}
        {refunded.map((sale) => (
          <Link key={sale.id} href={`/app/sales/${sale.id}`}>
            <Card className="transition-all duration-200 hover:border-primary/40 hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>{sale.receiptNumber ?? sale.id.slice(0, 8)}</CardTitle>
                  <Badge variant={getRefundBadgeVariant(sale.status)}>
                    {sale.status.replaceAll("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm">
                <div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground/70">Total</span>
                  <div className="font-semibold text-foreground">${sale.totalAmount.toString()}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}


