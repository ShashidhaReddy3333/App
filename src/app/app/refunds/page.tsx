import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refunds | Human Pulse",
};

import { Pagination } from "@/components/pagination";
import { LocationSwitcher } from "@/components/location-switcher";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/state-card";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { ACTIVE_BUSINESS_LOCATION_COOKIE } from "@/lib/location-preferences";
import { getBusinessLocationContext } from "@/lib/server/location-context";
import { listRefunds } from "@/lib/services/sales-query-service";

export default async function RefundsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await requirePermission("refunds");
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const { location, locations } = await getBusinessLocationContext(session.user.businessId!);
  const refunds = await listRefunds(session.user.businessId!, {
    page,
    pageSize: 20,
    locationId: location.id,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refunds"
        description={`Open a sale to create a partial or full refund with explicit stock return behavior for ${location.name}.`}
        breadcrumbs={[{ label: "Refunds" }]}
        actions={
          <LocationSwitcher
            label="Refund location"
            cookieName={ACTIVE_BUSINESS_LOCATION_COOKIE}
            locations={locations}
            value={location.id}
          />
        }
      />
      <div className="grid gap-4">
        {refunds.items.length === 0 ? (
          <EmptyState
            illustration="receipt"
            title="No refunds yet"
            description="Refunded sales will appear here once processed."
          />
        ) : null}
        {refunds.items.map((refund) => (
          <Link key={refund.id} href={`/app/sales/${refund.saleId}`}>
            <Card className="transition-all duration-200 hover:border-primary/40 hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>{refund.sale.receiptNumber ?? refund.sale.id.slice(0, 8)}</CardTitle>
                  <StatusBadge status={refund.status} />
                </div>
                <CardDescription>
                  Refund created {new Date(refund.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground/70">
                      Refund total
                    </span>
                    <div className="font-semibold text-foreground">
                      ${refund.refundTotalAmount.toString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground/70">
                      Sale total
                    </span>
                    <div className="font-semibold text-foreground">
                      ${refund.sale.totalAmount.toString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <Pagination
        basePath="/app/refunds"
        currentPage={refunds.currentPage}
        totalPages={refunds.totalPages}
        totalItems={refunds.totalCount}
      />
    </div>
  );
}
