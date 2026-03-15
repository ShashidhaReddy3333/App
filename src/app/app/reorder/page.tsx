import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { listReorderItems } from "@/lib/services/catalog-query-service";

export default async function ReorderPage() {
  const session = await requirePermission("reorder");
  const items = await listReorderItems(session.user.businessId!);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reorder list"
        description="Products appear here when available inventory falls below the configured par level."
      />
      <div className="grid gap-4">
        {items.length === 0 ? (
          <EmptyState title="No reorder items" description="Current available stock meets or exceeds all par levels." />
        ) : (
          items.map((item) => (
            <Card key={item.productId} className="gradient-panel">
              <CardHeader>
                <CardTitle>{item.productName}</CardTitle>
                <CardDescription>{item.supplierName}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                <div>Available: {item.availableQuantity}</div>
                <div>Par level: {item.parLevel}</div>
                <div>Suggested reorder: {item.suggestedReorderQuantity}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
