import { FulfillmentStatus, FulfillmentType, OrderStatus } from "@prisma/client";

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

export function getAllowedOrderStatusTransitions(
  orderStatus: OrderStatus,
  fulfillmentType: FulfillmentType
) {
  switch (orderStatus) {
    case OrderStatus.confirmed:
      return [OrderStatus.preparing];
    case OrderStatus.preparing:
      return [
        fulfillmentType === FulfillmentType.delivery
          ? OrderStatus.out_for_delivery
          : OrderStatus.ready_for_pickup,
      ];
    case OrderStatus.ready_for_pickup:
    case OrderStatus.out_for_delivery:
      return [OrderStatus.completed];
    default:
      return [];
  }
}

export function canTransitionOrderStatus(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
  fulfillmentType: FulfillmentType
) {
  return getAllowedOrderStatusTransitions(currentStatus, fulfillmentType).some(
    (candidate) => candidate === nextStatus
  );
}

export function getFulfillmentStatusForOrderStatus(
  orderStatus: OrderStatus,
  fulfillmentType: FulfillmentType
) {
  switch (orderStatus) {
    case OrderStatus.confirmed:
    case OrderStatus.preparing:
      return FulfillmentStatus.pending;
    case OrderStatus.ready_for_pickup:
      return fulfillmentType === FulfillmentType.delivery
        ? FulfillmentStatus.pending
        : FulfillmentStatus.ready;
    case OrderStatus.out_for_delivery:
      return FulfillmentStatus.in_transit;
    case OrderStatus.completed:
      return FulfillmentStatus.completed;
    case OrderStatus.cancelled:
      return FulfillmentStatus.cancelled;
    case OrderStatus.pending_payment:
    default:
      return FulfillmentStatus.pending;
  }
}
