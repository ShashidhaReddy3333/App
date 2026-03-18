import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sales History | Human Pulse",
};

import { Pagination } from "@/components/pagination";
import { PageHeader } from "@/components/page-header";
import { SearchFilter } from "@/components/search-filter";
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

export default async function SalesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await requirePermission("sales");
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);
  const sales = await listSales(session.user.businessId!, {
    q: query || undefined,
    page,
    pageSize: 20
  });
  const items = toSalesListItems(sales.items);
  const paginationParams = new URLSearchParams();
  if (query) {
    paginationParams.set("q", query);
  }
  const paginationBasePath = paginationParams.toString() ? `/app/sales?${paginationParams.toString()}` : "/app/sales";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales history"
        description="Review completed, pending, and refunded sales with receipt retrieval."
        breadcrumbs={[{ label: "Sales" }]}
      />
      <Suspense fallback={<div className="h-10 rounded-lg bg-secondary/50" />}>
        <SearchFilter placeholder="Search by receipt number..." paramName="q" />
      </Suspense>
      <div className="grid gap-4">
        {items.length === 0 ? (
          <EmptyState title="No sales yet" description="Completed and pending sales will appear here after the first checkout is created." />
        ) : null}
        {items.map((sale) => (
          <Link key={sale.id} href={`/app/sales/${sale.id}`}>
            <Card className="transition-all duration-200 hover:border-foreground/20 hover:shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>{sale.receiptNumber}</CardTitle>
                  <Badge variant={getStatusBadgeVariant(sale.statusLabel)}>{sale.statusLabel}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-4">
                <div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Total</span>
                  <div className="font-semibold text-foreground">${sale.totalAmount}</div>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Paid</span>
                  <div className="font-semibold text-foreground">${sale.amountPaid}</div>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Cashier</span>
                  <div className="font-medium">{sale.cashierName}</div>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Date</span>
                  <div className="font-medium">{sale.completedAtLabel}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <Pagination
        basePath={paginationBasePath}
        currentPage={sales.currentPage}
        totalPages={sales.totalPages}
        totalItems={sales.totalCount}
      />
    </div>
  );
}


