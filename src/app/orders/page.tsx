import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { Package } from "lucide-react";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "My Orders | Human Pulse",
};

import { CustomerShell } from "@/components/customer-shell";
import { Pagination } from "@/components/pagination";
import { SearchFilter } from "@/components/search-filter";
import { EmptyState } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/guards";
import { listCustomerOrders } from "@/lib/services/customer-commerce-query-service";

function getStatusBadgeVariant(status: string) {
  if (status.includes("pending") || status.includes("placed")) return "warning" as const;
  if (status.includes("completed") || status.includes("delivered") || status.includes("fulfilled"))
    return "success" as const;
  if (status.includes("cancelled") || status.includes("rejected") || status.includes("failed"))
    return "destructive" as const;
  return "secondary" as const;
}

function getStatusBorderColor(status: string) {
  if (status.includes("completed") || status.includes("delivered") || status.includes("fulfilled"))
    return "border-l-green-500";
  if (status.includes("pending") || status.includes("placed")) return "border-l-amber-500";
  if (status.includes("cancelled") || status.includes("rejected") || status.includes("failed"))
    return "border-l-red-500";
  return "border-l-gray-300";
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await requireRole("customer", "/sign-in");
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);
  const orders = await listCustomerOrders(session.user.id, {
    q: query || undefined,
    page,
    pageSize: 20,
  });
  const paginationParams = new URLSearchParams();
  if (query) {
    paginationParams.set("q", query);
  }
  const paginationBasePath = paginationParams.toString()
    ? `/orders?${paginationParams.toString()}`
    : "/orders";

  return (
    <CustomerShell customerName={session.user.fullName}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Package className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">My Orders</h1>
            <p className="text-sm text-muted-foreground">
              Track your online orders, fulfillment status, and payment history.
            </p>
          </div>
        </div>
        <Suspense fallback={<div className="h-10 rounded-lg bg-secondary/50" />}>
          <SearchFilter placeholder="Search by order number..." paramName="q" />
        </Suspense>

        {orders.items.length === 0 ? (
          <EmptyState
            icon="package"
            title="No orders yet"
            description="Your completed checkouts will appear here."
            action={
              <Button asChild>
                <Link href={"/shop" as Route}>Start shopping</Link>
              </Button>
            }
          />
        ) : null}

        <div className="space-y-0">
          {orders.items.map((order) => (
            <div
              key={order.id}
              className={`data-row border-l-4 ${getStatusBorderColor(order.status)} rounded-none first:rounded-t-[22px] last:rounded-b-[22px]`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold">{order.orderNumber}</span>
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {order.status.replaceAll("_", " ")}
                  </Badge>
                </div>
                <span className="text-lg font-bold">${Number(order.totalAmount).toFixed(2)}</span>
              </div>
              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>
                    {order.items.length} {order.items.length === 1 ? "item" : "items"}
                  </span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <Button asChild variant="secondary">
                  <Link href={`/orders/${order.id}` as Route}>View details</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Pagination
          basePath={paginationBasePath}
          currentPage={orders.currentPage}
          totalPages={orders.totalPages}
          totalItems={orders.totalCount}
        />
      </div>
    </CustomerShell>
  );
}
