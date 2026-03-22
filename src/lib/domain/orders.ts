import { FulfillmentStatus, OrderStatus } from "@prisma/client";

const CANCELLABLE_ORDER_STATUSES = new Set<OrderStatus>([
  OrderStatus.pending_payment,
  OrderStatus.confirmed,
]);

const CANCELLABLE_FULFILLMENT_STATUSES = new Set<FulfillmentStatus>([
  FulfillmentStatus.pending,
  FulfillmentStatus.scheduled,
]);

export function canCancelOrder(
  orderStatus: OrderStatus,
  fulfillmentStatus?: FulfillmentStatus | null
) {
  return (
    CANCELLABLE_ORDER_STATUSES.has(orderStatus) &&
    (!!fulfillmentStatus ? CANCELLABLE_FULFILLMENT_STATUSES.has(fulfillmentStatus) : true)
  );
}
