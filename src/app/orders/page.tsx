import Link from "next/link";
import type { Route } from "next";
import { Package } from "lucide-react";

import { CustomerShell } from "@/components/customer-shell";
import { EmptyState } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/guards";
import { listCustomerOrders } from "@/lib/services/customer-commerce-query-service";

function getStatusBadgeVariant(status: string) {
  if (status.includes("pending") || status.includes("placed")) return "warning" as const;
  if (status.includes("completed") || status.includes("delivered") || status.includes("fulfilled")) return "success" as const;
  if (status.includes("cancelled") || status.includes("rejected") || status.includes("failed")) return "destructive" as const;
  return "secondary" as const;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export default async function OrdersPage() {
  const session = await requireRole("customer", "/sign-in");
  const orders = await listCustomerOrders(session.user.id);

  return (
    <CustomerShell customerName={session.user.fullName}>
      <div className="space-y-6">
        <div className="animate-fade-in flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Package className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">My Orders</h1>
            <p className="text-sm text-muted-foreground">Track your online orders, fulfillment status, and payment history.</p>
          </div>
        </div>

        {orders.length === 0 ? (
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

        <div className="grid gap-4">
          {orders.map((order, index) => {
            const staggerClass = `stagger-${(index % 5) + 1}`;
            return (
              <Card key={order.id} className={`animate-fade-in-up ${staggerClass} gradient-panel overflow-hidden transition-all hover:-translate-y-0.5`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold">{order.orderNumber}</span>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <span className="text-lg font-bold">${Number(order.totalAmount).toFixed(2)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>{order.items.length} {order.items.length === 1 ? "item" : "items"}</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                  <Button asChild variant="secondary">
                    <Link href={`/orders/${order.id}` as Route}>View details</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </CustomerShell>
  );
}
