import { FulfillmentStatus, FulfillmentType, OrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  canCancelOrder,
  canTransitionOrderStatus,
  getAllowedOrderStatusTransitions,
  getFulfillmentStatusForOrderStatus,
} from "@/lib/domain/orders";
import { supportedPaymentProviders } from "@/lib/schemas/sales";

describe("order transitions", () => {
  it("allows pickup orders to move from preparing to ready for pickup", () => {
    expect(getAllowedOrderStatusTransitions(OrderStatus.preparing, FulfillmentType.pickup)).toEqual(
      [OrderStatus.ready_for_pickup]
    );
  });

  it("allows delivery orders to move from preparing to out for delivery", () => {
    expect(
      getAllowedOrderStatusTransitions(OrderStatus.preparing, FulfillmentType.delivery)
    ).toEqual([OrderStatus.out_for_delivery]);
  });

  it("validates completion transitions by fulfillment type", () => {
    expect(
      canTransitionOrderStatus(
        OrderStatus.ready_for_pickup,
        OrderStatus.completed,
        FulfillmentType.pickup
      )
    ).toBe(true);
    expect(
      canTransitionOrderStatus(OrderStatus.confirmed, OrderStatus.completed, FulfillmentType.pickup)
    ).toBe(false);
  });

  it("maps order states back to fulfillment states", () => {
    expect(
      getFulfillmentStatusForOrderStatus(OrderStatus.ready_for_pickup, FulfillmentType.pickup)
    ).toBe(FulfillmentStatus.ready);
    expect(
      getFulfillmentStatusForOrderStatus(OrderStatus.out_for_delivery, FulfillmentType.delivery)
    ).toBe(FulfillmentStatus.in_transit);
  });

  it("only allows cancellation before fulfillment starts", () => {
    expect(canCancelOrder(OrderStatus.confirmed, FulfillmentStatus.pending)).toBe(true);
    expect(canCancelOrder(OrderStatus.preparing, FulfillmentStatus.pending)).toBe(false);
  });
});

describe("supported providers", () => {
  it("does not expose the unsupported square provider in active UI lists", () => {
    expect(supportedPaymentProviders).toEqual(["stripe", "manual"]);
  });
});
