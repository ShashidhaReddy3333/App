import { InventoryMovementType, PaymentStatus, Prisma } from "@prisma/client";

import { logAudit } from "@/lib/audit";
import { canCancelOrder } from "@/lib/domain/orders";
import { db } from "@/lib/db";
import { conflictError, notFoundError } from "@/lib/errors";
import { restockInventory } from "@/lib/services/command-helpers";

type LoadedOrder = Prisma.OrderGetPayload<{
  include: {
    items: true;
    fulfillment: true;
    payments: true;
  };
}>;

async function cancelLoadedOrder(
  tx: Prisma.TransactionClient,
  order: LoadedOrder,
  actorUserId: string,
  note: string
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

  await tx.orderPayment.updateMany({
    where: { orderId: order.id },
    data: { status: PaymentStatus.voided },
  });

  if (order.fulfillment) {
    await tx.orderFulfillment.update({
      where: { orderId: order.id },
      data: { status: "cancelled" },
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
      paymentStatus: PaymentStatus.voided,
    },
    include: {
      items: true,
      fulfillment: true,
      payments: true,
    },
  });

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
    },
  });

  return updatedOrder;
}

export async function cancelCustomerOrder(customerId: string, orderId: string) {
  return db.$transaction(
    async (tx) => {
      const order = await tx.order.findFirst({
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

      return cancelLoadedOrder(
        tx,
        order,
        customerId,
        "Customer cancelled order before fulfillment."
      );
    },
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

      return cancelLoadedOrder(
        tx,
        order,
        actorUserId,
        "Retail staff cancelled order before fulfillment."
      );
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );
}
