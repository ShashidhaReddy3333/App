import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { listSales } from "@/lib/services/sales-query-service";

export default async function RefundsPage() {
  const session = await requirePermission("refunds");
  const sales = await listSales(session.user.businessId!);
  const refunded = sales.filter((sale) => sale.status === "refunded_partially" || sale.status === "refunded_fully");

  return (
    <div className="space-y-6">
      <PageHeader title="Refunds" description="Open a sale to create a partial or full refund with explicit stock return behavior." />
      <div className="grid gap-4">
        {refunded.length === 0 ? <EmptyState title="No refunds yet" description="Refunded sales will appear here once processed." /> : null}
        {refunded.map((sale) => (
          <Link key={sale.id} href={`/app/sales/${sale.id}`}>
            <Card className="gradient-panel">
              <CardHeader>
                <CardTitle>{sale.receiptNumber ?? sale.id.slice(0, 8)}</CardTitle>
                <CardDescription>
                  <Badge>{sale.status.replaceAll("_", " ")}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">${sale.totalAmount.toString()}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
