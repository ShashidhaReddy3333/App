import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";

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
      />
      {orders.length === 0 ? (
        <EmptyState title="No online orders yet" description="Customer web checkouts will appear here as soon as the storefront goes live." />
      ) : null}
      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="gradient-panel">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>{order.orderNumber}</span>
                <span className="text-base capitalize">{order.status.replaceAll("_", " ")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
              <div>Customer: {order.customer?.fullName ?? "Guest"}</div>
              <div>Fulfillment: {order.fulfillmentType.replaceAll("_", " ")}</div>
              <div>Total: ${Number(order.totalAmount).toFixed(2)}</div>
              <div className="md:col-span-3">
                {order.items.map((item) => `${item.product.name} x ${Number(item.quantity).toFixed(0)}`).join(", ")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
