import { InventoryMovementType, OrderStatus, PaymentStatus, Prisma } from "@prisma/client";

import { logAudit } from "@/lib/audit";
import {
  canCancelOrder,
  canTransitionOrderStatus,
  getFulfillmentStatusForOrderStatus,
} from "@/lib/domain/orders";
import { db } from "@/lib/db";
import { conflictError, notFoundError } from "@/lib/errors";
import { updateOrderStatusSchema } from "@/lib/schemas/orders";
import { enqueueNotification } from "@/lib/services/notification-service";
import { restockInventory } from "@/lib/services/command-helpers";
import { isStripeConfigured, stripe } from "@/lib/stripe/client";

type LoadedOrder = Prisma.OrderGetPayload<{
  include: {
    items: true;
    fulfillment: true;
    payments: true;
  };
}>;

function getOrderStatusNotification(orderNumber: string, status: OrderStatus) {
  switch (status) {
    case OrderStatus.preparing:
      return {
        type: "order_preparing",
        title: "Order in progress",
        message: `Your order ${orderNumber} is now being prepared.`,
      };
    case OrderStatus.ready_for_pickup:
      return {
        type: "order_ready_for_pickup",
        title: "Order ready for pickup",
        message: `Your order ${orderNumber} is ready for pickup.`,
      };
    case OrderStatus.out_for_delivery:
      return {
        type: "order_out_for_delivery",
        title: "Order out for delivery",
        message: `Your order ${orderNumber} is out for delivery.`,
      };
    case OrderStatus.completed:
      return {
        type: "order_completed",
        title: "Order completed",
        message: `Your order ${orderNumber} has been completed.`,
      };
    case OrderStatus.cancelled:
      return {
        type: "order_cancelled",
        title: "Order cancelled",
        message: `Your order ${orderNumber} has been cancelled.`,
      };
    case OrderStatus.confirmed:
      return {
        type: "order_confirmed",
        title: "Order confirmed",
        message: `Your order ${orderNumber} has been confirmed.`,
      };
    default:
      return null;
  }
}

async function reverseStripePayment(order: LoadedOrder) {
  if (!isStripeConfigured()) {
    return null;
  }

  const stripePaymentRecord = await db.stripePaymentIntent.findFirst({
    where: { orderId: order.id },
    orderBy: { createdAt: "desc" },
  });

  let paymentIntentId =
    order.payments.find((payment) => payment.provider === "stripe")?.stripePaymentIntentId ??
    stripePaymentRecord?.stripePaymentIntentId ??
    null;

  if (!paymentIntentId && order.stripeCheckoutSessionId) {
    const session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId, {
      expand: ["payment_intent"],
    });
    const paymentIntent = session.payment_intent;
    paymentIntentId =
      typeof paymentIntent === "string" ? paymentIntent : (paymentIntent?.id ?? null);
  }

  if (!paymentIntentId) {
    return null;
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const idempotencyKey = `order-cancel-${order.id}`;

  if (
    [
      "requires_payment_method",
      "requires_confirmation",
      "requires_action",
      "requires_capture",
      "processing",
    ].includes(paymentIntent.status)
  ) {
    await stripe.paymentIntents.cancel(paymentIntentId, undefined, { idempotencyKey });
    return PaymentStatus.voided;
  }

  if (paymentIntent.status === "succeeded") {
    await stripe.refunds.create(
      {
        payment_intent: paymentIntentId,
        reason: "requested_by_customer",
      },
      { idempotencyKey }
    );
    return PaymentStatus.refunded_full;
  }

  return PaymentStatus.voided;
}

async function enqueueCustomerOrderNotification(
  tx: Prisma.TransactionClient,
  order: LoadedOrder,
  status: OrderStatus
) {
  if (!order.customerId) {
    return;
  }

  const notification = getOrderStatusNotification(order.orderNumber, status);
  if (!notification) {
    return;
  }

  await enqueueNotification(tx, {
    userId: order.customerId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    channel: "email",
  });
}

async function cancelLoadedOrder(
  tx: Prisma.TransactionClient,
  order: LoadedOrder,
  actorUserId: string,
  note: string,
  paymentStatusOverride?: PaymentStatus | null
) {
  if (order.status === "cancelled") {
    throw conflictError("This order has already been cancelled.");
  }

  if (!canCancelOrder(order.status, order.fulfillment?.status)) {
    throw conflictError(
      "This order can no longer be cancelled because fulfillment has already started."
    );
  }

  for (const item of order.items) {
    await restockInventory(tx, {
      productId: item.productId,
      locationId: order.locationId,
      quantity: Number(item.quantity),
      referenceId: order.id,
      createdById: actorUserId,
      reason: "order_cancelled",
      referenceType: "order",
      movementType: InventoryMovementType.sale_void,
    });
  }

  const paymentStatus = paymentStatusOverride ?? PaymentStatus.voided;
  await tx.orderPayment.updateMany({
    where: { orderId: order.id },
    data: { status: paymentStatus },
  });

  if (order.fulfillment) {
    await tx.orderFulfillment.update({
      where: { orderId: order.id },
      data: {
        status: getFulfillmentStatusForOrderStatus(OrderStatus.cancelled, order.fulfillmentType),
      },
    });
  }

  await tx.orderStatusHistory.create({
    data: {
      orderId: order.id,
      oldStatus: order.status,
      newStatus: "cancelled",
      changedByUserId: actorUserId,
      notes: note,
    },
  });

  const updatedOrder = await tx.order.update({
    where: { id: order.id },
    data: {
      status: "cancelled",
      paymentStatus,
    },
    include: {
      items: true,
      fulfillment: true,
      payments: true,
    },
  });

  await enqueueCustomerOrderNotification(tx, updatedOrder, OrderStatus.cancelled);

  await logAudit({
    tx,
    businessId: order.businessId,
    actorUserId,
    action: "order_cancelled",
    resourceType: "order",
    resourceId: order.id,
    metadata: {
      orderNumber: order.orderNumber,
      previousStatus: order.status,
      paymentStatus,
    },
  });

  return updatedOrder;
}

export async function cancelCustomerOrder(customerId: string, orderId: string) {
  const order = await db.order.findFirst({
    where: {
      id: orderId,
      customerId,
    },
    include: {
      items: true,
      fulfillment: true,
      payments: true,
    },
  });

  if (!order) {
    throw notFoundError("Order not found.");
  }

  const paymentStatusOverride = await reverseStripePayment(order);

  return db.$transaction(
    async (tx) =>
      cancelLoadedOrder(
        tx,
        order,
        customerId,
        "Customer cancelled order before fulfillment.",
        paymentStatusOverride
      ),
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );
}

export async function cancelBusinessOrder(
  actorUserId: string,
  businessId: string,
  orderId: string
) {
  const order = await db.order.findFirst({
    where: {
      id: orderId,
      businessId,
    },
    include: {
      items: true,
      fulfillment: true,
      payments: true,
    },
  });

  if (!order) {
    throw notFoundError("Order not found.");
  }

  const paymentStatusOverride = await reverseStripePayment(order);

  return db.$transaction(
    async (tx) =>
      cancelLoadedOrder(
        tx,
        order,
        actorUserId,
        "Retail staff cancelled order before fulfillment.",
        paymentStatusOverride
      ),
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );
}

export async function updateBusinessOrderStatus(
  actorUserId: string,
  businessId: string,
  orderId: string,
  input: unknown
) {
  const values = updateOrderStatusSchema.parse(input);

  return db.$transaction(
    async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          id: orderId,
          businessId,
        },
        include: {
          items: true,
          fulfillment: true,
          payments: true,
        },
      });

      if (!order) {
        throw notFoundError("Order not found.");
      }

      if (!canTransitionOrderStatus(order.status, values.status, order.fulfillmentType)) {
        throw conflictError("This order cannot transition to the requested status.");
      }

      const nextFulfillmentStatus = getFulfillmentStatusForOrderStatus(
        values.status,
        order.fulfillmentType
      );

      if (order.fulfillment) {
        await tx.orderFulfillment.update({
          where: { orderId: order.id },
          data: { status: nextFulfillmentStatus },
        });
      } else {
        await tx.orderFulfillment.create({
          data: {
            orderId: order.id,
            status: nextFulfillmentStatus,
          },
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          oldStatus: order.status,
          newStatus: values.status,
          changedByUserId: actorUserId,
          notes: values.note?.trim() || null,
        },
      });

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: values.status,
          ...(values.status === OrderStatus.completed ? { completedAt: new Date() } : {}),
        },
        include: {
          items: true,
          fulfillment: true,
          payments: true,
        },
      });

      await enqueueCustomerOrderNotification(tx, updatedOrder, values.status);

      await logAudit({
        tx,
        businessId,
        actorUserId,
        action: "order_status_updated",
        resourceType: "order",
        resourceId: order.id,
        metadata: {
          orderNumber: order.orderNumber,
          oldStatus: order.status,
          newStatus: values.status,
        },
      });

      return updatedOrder;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );
}
