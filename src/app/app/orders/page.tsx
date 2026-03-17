import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";

function getOrderBadgeVariant(status: string): "success" | "warning" | "destructive" | "default" | "secondary" {
  if (status === "completed") return "success";
  if (status === "cancelled") return "destructive";
  if (status === "confirmed" || status === "preparing" || status === "ready_for_pickup") return "default";
  if (status === "pending_payment") return "warning";
  if (status === "out_for_delivery") return "secondary";
  return "default";
}

export default async function OnlineOrdersPage() {
  const session = await requirePermission("sales");
  const orders = await db.order.findMany({
    where: { businessId: session.user.businessId! },
    include: {
      items: {
        include: {
          product: true
        }
      },
      customer: true,
      fulfillment: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Online orders"
        description="Monitor customer web orders alongside your in-store checkout and call-order operations."
        breadcrumbs={[{ label: "Online Orders" }]}
      />
      {orders.length === 0 ? (
        <EmptyState icon="cart" title="No online orders yet" description="Customer web checkouts will appear here as soon as the storefront goes live." />
      ) : null}
      <div className="grid gap-4">
        {orders.map((order, index) => (
          <Card key={order.id} className={`gradient-panel animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}>
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
                  <span className="text-xs uppercase tracking-wide text-muted-foreground/70">Customer</span>
                  <div className="font-medium">{order.customer?.fullName ?? "Guest"}</div>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground/70">Fulfillment</span>
                  <div className="font-medium capitalize">{order.fulfillmentType.replaceAll("_", " ")}</div>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground/70">Total</span>
                  <div className="font-semibold text-foreground">${Number(order.totalAmount).toFixed(2)}</div>
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-white/60 p-3 text-sm text-muted-foreground">
                {order.items.map((item) => `${item.product.name} x ${Number(item.quantity).toFixed(0)}`).join(", ")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
