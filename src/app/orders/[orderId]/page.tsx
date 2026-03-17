import Link from "next/link";
import type { Route } from "next";
import { ChevronRight, CreditCard, MapPin, Truck } from "lucide-react";

import { CustomerShell } from "@/components/customer-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import { getCustomerOrderDetail } from "@/lib/services/customer-commerce-query-service";

function getStatusBadgeVariant(status: string) {
  if (status.includes("pending") || status.includes("placed")) return "warning" as const;
  if (status.includes("completed") || status.includes("delivered") || status.includes("fulfilled") || status.includes("paid")) return "success" as const;
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

export default async function OrderDetailPage({
  params
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await requireRole("customer", "/sign-in");
  const { orderId } = await params;
  const order = await getCustomerOrderDetail(session.user.id, orderId);

  return (
    <CustomerShell customerName={session.user.fullName}>
      <div className="space-y-6">
        <nav className="animate-fade-in flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href={"/orders" as Route} className="transition hover:text-foreground">My Orders</Link>
          <ChevronRight className="size-3.5" />
          <span className="font-medium text-foreground">{order.orderNumber}</span>
        </nav>

        <div className="animate-fade-in-up flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{order.orderNumber}</h1>
          <Badge variant={getStatusBadgeVariant(order.status)} className="text-sm">
            {order.status.replaceAll("_", " ")}
          </Badge>
          <Badge variant="outline" className="text-sm">
            {order.fulfillmentType.replaceAll("_", " ")}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card className="animate-fade-in-up stagger-1 gradient-panel">
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border bg-white/60 p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 text-sm font-bold text-amber-400">
                        {item.product.name.charAt(0)}
                      </div>
                      <span className="font-medium">{item.product.name}</span>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">${(Number(item.unitPrice) * Number(item.quantity)).toFixed(2)}</div>
                      <div className="text-muted-foreground">{Number(item.quantity).toFixed(0)} x ${Number(item.unitPrice).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="font-medium">Total</span>
                  <span className="text-2xl font-bold">${Number(order.totalAmount).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="animate-fade-in-up stagger-2 gradient-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="size-5 text-muted-foreground" />
                  Fulfillment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={getStatusBadgeVariant(order.fulfillment?.status ?? "pending")}>
                    {order.fulfillment?.status.replaceAll("_", " ") ?? "pending"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">{order.fulfillmentType.replaceAll("_", " ")}</span>
                </div>
                {order.fulfillment?.deliveryAddress ? (
                  <div className="flex items-start gap-2 rounded-xl border bg-muted/30 p-3 text-sm">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Delivery Address</div>
                      <div className="text-muted-foreground">{order.fulfillment.deliveryAddress.line1}, {order.fulfillment.deliveryAddress.city}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 rounded-xl border bg-muted/30 p-3 text-sm">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Pickup Location</div>
                      <div className="text-muted-foreground">{order.location.name}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="animate-fade-in-up stagger-3 gradient-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="size-5 text-muted-foreground" />
                  Payments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-xl border bg-white/60 p-3">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium capitalize">{payment.method.replaceAll("_", " ")}</div>
                      <Badge variant={getStatusBadgeVariant(payment.status)} className="text-[10px]">
                        {payment.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <span className="text-lg font-semibold">${Number(payment.amount).toFixed(2)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="animate-fade-in-up stagger-4 gradient-panel">
              <CardHeader>
                <CardTitle>Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-0">
                  {order.statusHistory.map((entry, index) => (
                    <div key={entry.id} className="relative flex gap-3 pb-6 last:pb-0">
                      {index < order.statusHistory.length - 1 ? (
                        <div className="absolute left-[9px] top-5 h-full w-0.5 bg-border" />
                      ) : null}
                      <div className="relative mt-1 flex size-[18px] shrink-0 items-center justify-center">
                        <div className={`size-3 rounded-full ${index === 0 ? "bg-amber-500 ring-4 ring-amber-100" : "bg-muted-foreground/30"}`} />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(entry.newStatus)} className="text-[10px]">
                            {entry.newStatus.replaceAll("_", " ")}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{formatDate(entry.changedAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
