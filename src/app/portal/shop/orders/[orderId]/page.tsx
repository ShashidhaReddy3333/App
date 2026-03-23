import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { Check, ChevronRight, CreditCard, MapPin, Truck } from "lucide-react";

import { CustomerShell } from "@/components/customer-shell";
import { CancelOrderButton } from "@/components/cancel-order-button";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import { canCancelOrder } from "@/lib/domain/orders";
import { withNoIndex } from "@/lib/public-metadata";
import { getStatusDotClass } from "@/lib/status-semantics";
import { getCustomerOrderDetail } from "@/lib/services/customer-commerce-query-service";

export const metadata: Metadata = withNoIndex({
  title: "Order Details | Human Pulse",
});

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const ORDER_STEPS = ["placed", "confirmed", "preparing", "ready", "completed"];

function getStepIndex(status: string): number {
  if (status.includes("placed")) return 0;
  if (status.includes("confirmed") || status.includes("paid")) return 1;
  if (status.includes("preparing") || status.includes("in_progress")) return 2;
  if (status.includes("ready") || status.includes("fulfilled") || status.includes("delivered")) {
    return 3;
  }
  if (status.includes("completed")) return 4;
  return 0;
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await requireRole("customer", "/sign-in");
  const { orderId } = await params;
  const order = await getCustomerOrderDetail(session.user.id, orderId);
  const currentStepIndex = getStepIndex(order.status);
  const canCancel = canCancelOrder(order.status, order.fulfillment?.status);

  return (
    <CustomerShell customerName={session.user.fullName}>
      <div className="space-y-6">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href={"/orders" as Route} className="transition hover:text-foreground">
            My Orders
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="font-medium text-foreground">{order.orderNumber}</span>
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{order.orderNumber}</h1>
          <StatusBadge status={order.status} className="text-sm" />
          <StatusBadge
            status="draft"
            label={order.fulfillmentType.replaceAll("_", " ")}
            className="text-sm"
          />
          {canCancel ? (
            <CancelOrderButton endpoint={`/api/customer/orders/${order.id}/cancel`} />
          ) : null}
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <div
            className="flex items-center justify-between"
            role="list"
            aria-label="Order progress"
          >
            {ORDER_STEPS.map((step, index) => (
              <div
                key={step}
                className="flex flex-1 items-center"
                role="listitem"
                aria-label={`${step} - ${index < currentStepIndex ? "completed" : index === currentStepIndex ? "current" : "upcoming"}`}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex size-8 items-center justify-center rounded-full text-xs font-medium ${
                      index <= currentStepIndex
                        ? "bg-[#06C167] text-white"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {index < currentStepIndex ? <Check className="size-4" /> : index + 1}
                  </div>
                  <span
                    className={`text-xs capitalize ${
                      index <= currentStepIndex
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {index < ORDER_STEPS.length - 1 ? (
                  <div
                    className={`mx-2 h-0.5 flex-1 ${
                      index < currentStepIndex ? "bg-[#06C167]" : "bg-secondary"
                    }`}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent>
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-foreground">
                        {item.product.name.charAt(0)}
                      </div>
                      <span className="font-medium">{item.product.name}</span>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">
                        ${(Number(item.unitPrice) * Number(item.quantity)).toFixed(2)}
                      </div>
                      <div className="text-muted-foreground">
                        {Number(item.quantity).toFixed(0)} x ${Number(item.unitPrice).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="mt-1 flex items-center justify-between border-t border-border pt-4">
                  <span className="font-medium">Total</span>
                  <span className="text-2xl font-bold">
                    ${Number(order.totalAmount).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="size-5 text-muted-foreground" />
                  Fulfillment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <StatusBadge status={order.fulfillment?.status ?? "pending"} />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">
                    {order.fulfillmentType.replaceAll("_", " ")}
                  </span>
                </div>
                {order.fulfillment?.deliveryAddress ? (
                  <div className="flex items-start gap-2 rounded-lg border bg-secondary/50 p-3 text-sm">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Delivery Address</div>
                      <div className="text-muted-foreground">
                        {order.fulfillment.deliveryAddress.line1},{" "}
                        {order.fulfillment.deliveryAddress.city}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 rounded-lg border bg-secondary/50 p-3 text-sm">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Pickup Location</div>
                      <div className="text-muted-foreground">{order.location.name}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="size-5 text-muted-foreground" />
                  Payments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium capitalize">
                        {payment.method.replaceAll("_", " ")}
                      </div>
                      <StatusBadge status={payment.status} className="text-[10px]" />
                    </div>
                    <span className="text-lg font-semibold">
                      ${Number(payment.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
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
                        <div
                          className={`size-3 rounded-full ${getStatusDotClass(entry.newStatus)}`}
                        />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={entry.newStatus} className="text-[10px]" />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(entry.changedAt)}
                        </div>
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
