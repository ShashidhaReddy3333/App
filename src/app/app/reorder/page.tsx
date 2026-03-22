import type { Metadata } from "next";
import { ReorderCreatePoButton } from "@/components/reorder-create-po-button";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { listReorderItems } from "@/lib/services/catalog-query-service";

export const metadata: Metadata = {
  title: "Reorder Alerts | Human Pulse",
};

export default async function ReorderPage() {
  const session = await requirePermission("reorder");
  const items = await listReorderItems(session.user.businessId!);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reorder list"
        description="Products appear here when available inventory falls below the configured par level."
        breadcrumbs={[{ label: "Reorder" }]}
      />
      <div className="grid gap-4">
        {items.length === 0 ? (
          <EmptyState
            illustration="inventory"
            title="No reorder items"
            description="Current available stock meets or exceeds all par levels."
          />
        ) : (
          items.map((item, index) => {
            const ratio = item.parLevel > 0 ? item.availableQuantity / item.parLevel : 1;
            const isCritical = ratio < 0.25;
            const isLow = ratio < 0.5;
            return (
              <Card
                key={item.productId}
                className={`${isCritical ? "border-l-4 border-l-red-500" : isLow ? "border-l-4 border-l-amber-500" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{item.productName}</CardTitle>
                      <CardDescription>{item.supplierName}</CardDescription>
                    </div>
                    {isCritical ? (
                      <StatusBadge status="failed" label="Critical" />
                    ) : isLow ? (
                      <StatusBadge status="pending" label="Low stock" />
                    ) : (
                      <StatusBadge status="draft" label="Below par" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground/70">
                      Available
                    </span>
                    <div
                      className={`font-semibold ${isCritical ? "text-red-600" : isLow ? "text-amber-600" : "text-foreground"}`}
                    >
                      {item.availableQuantity}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground/70">
                      Par level
                    </span>
                    <div className="font-medium">{item.parLevel}</div>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground/70">
                      Suggested reorder
                    </span>
                    <div className="font-semibold text-primary">
                      {item.suggestedReorderQuantity}
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    {item.supplierId && item.supplierProductId ? (
                      <ReorderCreatePoButton
                        supplierId={item.supplierId}
                        supplierProductId={item.supplierProductId}
                        locationId={item.locationId}
                        quantity={item.suggestedReorderQuantity}
                      />
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border/60 px-4 py-3 text-sm text-muted-foreground">
                        {item.reorderBlockedReason}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
