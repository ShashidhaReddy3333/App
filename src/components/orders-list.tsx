"use client";

import { CancelOrderButton } from "@/components/cancel-order-button";
import { SearchFilter } from "@/components/search-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";

type OrderItem = {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  fulfillmentType: string;
  totalAmount: string;
  itemsSummary: string;
  canCancel?: boolean;
};

export function OrdersList({ orders }: { orders: OrderItem[] }) {
  return (
    <SearchFilter data={orders} searchKey="orderNumber" placeholder="Search by order number...">
      {(filtered) => (
        <div className="grid gap-4">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No orders match your search.
            </p>
          ) : null}
          {filtered.map((order, index) => (
            <Card
              key={order.id}
              className={`gradient-panel animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between gap-3">
                  <span>{order.orderNumber}</span>
                  <StatusBadge status={order.status} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground/70">
                      Customer
                    </span>
                    <div className="font-medium">{order.customerName}</div>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground/70">
                      Fulfillment
                    </span>
                    <div className="font-medium capitalize">
                      {order.fulfillmentType.replaceAll("_", " ")}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground/70">
                      Total
                    </span>
                    <div className="font-semibold text-foreground">${order.totalAmount}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-white/60 p-3 text-sm text-muted-foreground">
                  {order.itemsSummary}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  {order.canCancel ? (
                    <CancelOrderButton endpoint={`/api/orders/${order.id}/cancel`} />
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </SearchFilter>
  );
}
