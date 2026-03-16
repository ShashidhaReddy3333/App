import Link from "next/link";
import type { Route } from "next";

import { CustomerShell } from "@/components/customer-shell";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/guards";
import { listCustomerOrders } from "@/lib/services/customer-commerce-query-service";

export default async function OrdersPage() {
  const session = await requireRole("customer", "/sign-in");
  const orders = await listCustomerOrders(session.user.id);

  return (
    <CustomerShell customerName={session.user.fullName}>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">My orders</h1>
          <p className="text-muted-foreground">Track your online orders, fulfillment status, and payment history.</p>
        </div>
        {orders.length === 0 ? <EmptyState title="No orders yet" description="Your completed checkouts will appear here." /> : null}
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="gradient-panel">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                  <span>{order.orderNumber}</span>
                  <span className="text-base capitalize">{order.status.replaceAll("_", " ")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">
                  <div>{order.items.length} items</div>
                  <div>{new Date(order.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-medium">${Number(order.totalAmount).toFixed(2)}</div>
                  <Button asChild variant="secondary">
                    <Link href={`/orders/${order.id}` as Route}>View details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </CustomerShell>
  );
}
