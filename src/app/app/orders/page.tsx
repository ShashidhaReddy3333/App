import { OrdersList } from "@/components/orders-list";
import { LocationSwitcher } from "@/components/location-switcher";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/state-card";
import { requirePermission } from "@/lib/auth/guards";
import { canCancelOrder, getAllowedOrderStatusTransitions } from "@/lib/domain/orders";
import { ACTIVE_BUSINESS_LOCATION_COOKIE } from "@/lib/location-preferences";
import { getBusinessLocationContext } from "@/lib/server/location-context";
import { listOnlineOrders } from "@/lib/services/sales-query-service";

export default async function OnlineOrdersPage() {
  const session = await requirePermission("sales");
  const { location, locations } = await getBusinessLocationContext(session.user.businessId!);
  const orders = await listOnlineOrders(session.user.businessId!, {
    locationId: location.id,
    pageSize: 100,
  });

  const orderItems = orders.items.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: order.customer?.fullName ?? "Guest",
    fulfillmentType: order.fulfillmentType,
    totalAmount: Number(order.totalAmount).toFixed(2),
    itemsSummary: order.items
      .map((item) => `${item.product.name} x ${Number(item.quantity).toFixed(0)}`)
      .join(", "),
    canCancel: canCancelOrder(order.status, order.fulfillment?.status),
    nextStatuses: getAllowedOrderStatusTransitions(order.status, order.fulfillmentType),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Online orders"
        description={`Monitor customer web orders alongside your in-store checkout and call-order operations for ${location.name}.`}
        breadcrumbs={[{ label: "Online Orders" }]}
        actions={
          <LocationSwitcher
            label="Fulfillment store"
            cookieName={ACTIVE_BUSINESS_LOCATION_COOKIE}
            locations={locations}
            value={location.id}
          />
        }
      />
      {orders.items.length === 0 ? (
        <EmptyState
          illustration="order"
          title="No online orders yet"
          description="Customer web checkouts will appear here as soon as the storefront goes live."
        />
      ) : (
        <OrdersList orders={orderItems} />
      )}
    </div>
  );
}
