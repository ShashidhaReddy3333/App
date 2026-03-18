import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Online Orders | Human Pulse",
};

import { Pagination } from "@/components/pagination";
import { PageHeader } from "@/components/page-header";
import { SearchFilter } from "@/components/search-filter";
import { EmptyState } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { listOnlineOrders } from "@/lib/services/sales-query-service";

const statuses = ["all", "pending_payment", "confirmed", "preparing", "completed", "cancelled"] as const;
type OrderStatusFilter = (typeof statuses)[number];

function parseStatus(value?: string): OrderStatusFilter {
  if (value && statuses.includes(value as OrderStatusFilter)) {
    return value as OrderStatusFilter;
  }
  return "all";
}

function formatStatus(value: OrderStatusFilter) {
  if (value === "all") return "All";
  return value
    .split("_")
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

function buildStatusHref(status: OrderStatusFilter, query: string) {
  const params = new URLSearchParams();
  if (query) {
    params.set("q", query);
  }
  if (status !== "all") {
    params.set("status", status);
  }
  const search = params.toString();
  return search ? `?${search}` : "?";
}

function getOrderBadgeVariant(status: string): "success" | "warning" | "destructive" | "default" | "secondary" {
  if (status === "completed") return "success";
  if (status === "cancelled") return "destructive";
  if (status === "confirmed" || status === "preparing" || status === "ready_for_pickup") return "default";
  if (status === "pending_payment") return "warning";
  if (status === "out_for_delivery") return "secondary";
  return "default";
}

export default async function OnlineOrdersPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const session = await requirePermission("sales");
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const currentStatus = parseStatus(params.status);
  const page = Math.max(1, Number(params.page) || 1);
  const orders = await listOnlineOrders(session.user.businessId!, {
    q: query || undefined,
    status: currentStatus === "all" ? undefined : currentStatus,
    page,
    pageSize: 20
  });
  const paginationParams = new URLSearchParams();
  if (query) {
    paginationParams.set("q", query);
  }
  if (currentStatus !== "all") {
    paginationParams.set("status", currentStatus);
  }
  const paginationBasePath = paginationParams.toString() ? `/app/orders?${paginationParams.toString()}` : "/app/orders";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Online orders"
        description="Monitor customer web orders alongside your in-store checkout and call-order operations."
        breadcrumbs={[{ label: "Online Orders" }]}
      />
      <Suspense fallback={<div className="h-10 rounded-lg bg-secondary/50" />}>
        <SearchFilter placeholder="Search by order number or customer name..." paramName="q" />
      </Suspense>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statuses.map((status) => (
          <Link
            key={status}
            href={buildStatusHref(status, query) as Route}
            className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap ${
              currentStatus === status ? "bg-foreground text-background" : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}
          >
            {formatStatus(status)}
          </Link>
        ))}
      </div>
      {orders.items.length === 0 ? (
        <EmptyState icon="cart" title="No online orders yet" description="Customer web checkouts will appear here as soon as the storefront goes live." />
      ) : null}
      <div className="grid gap-4">
        {orders.items.map((order) => (
          <Card key={order.id}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between gap-3">
                <span>{order.orderNumber}</span>
                <Badge variant={getOrderBadgeVariant(order.status)}>
                  {order.status.replaceAll("_", " ")}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 text-sm md:grid-cols-3">
                <div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Customer</span>
                  <div className="text-foreground font-medium">{order.customer?.fullName ?? "Guest"}</div>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Fulfillment</span>
                  <div className="text-foreground font-medium capitalize">{order.fulfillmentType.replaceAll("_", " ")}</div>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Total</span>
                  <div className="text-foreground font-medium">${Number(order.totalAmount).toFixed(2)}</div>
                </div>
              </div>
              <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                {order.items.map((item) => `${item.product.name} x ${Number(item.quantity).toFixed(0)}`).join(", ")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Pagination
        basePath={paginationBasePath}
        currentPage={orders.currentPage}
        totalPages={orders.totalPages}
        totalItems={orders.totalCount}
      />
    </div>
  );
}


