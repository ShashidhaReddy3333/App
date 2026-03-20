import { OrdersList } from "@/components/orders-list";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/state-card";
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

  const orderItems = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: order.customer?.fullName ?? "Guest",
    fulfillmentType: order.fulfillmentType,
    totalAmount: Number(order.totalAmount).toFixed(2),
    itemsSummary: order.items.map((item) => `${item.product.name} x ${Number(item.quantity).toFixed(0)}`).join(", ")
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Online orders"
        description="Monitor customer web orders alongside your in-store checkout and call-order operations."
        breadcrumbs={[{ label: "Online Orders" }]}
      />
      {orders.length === 0 ? (
        <EmptyState icon="cart" title="No online orders yet" description="Customer web checkouts will appear here as soon as the storefront goes live." />
      ) : (
        <OrdersList orders={orderItems} />
      )}
    </div>
  );
}
