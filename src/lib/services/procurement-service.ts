import { InventoryMovementType, Prisma, PurchaseOrderStatus } from "@prisma/client";
import { z } from "zod";

import { logAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { notFoundError, validationError } from "@/lib/errors";
import { computeAvailableQuantity } from "@/lib/domain/inventory";
import { toDecimal } from "@/lib/money";
import {
  purchaseOrderSchema,
  receivePurchaseOrderSchema,
  supplierOrderStatusSchema,
  supplierProductSchema,
} from "@/lib/schemas/procurement";
import {
  allocatePurchaseOrderNumber,
  createIdempotencyRecord,
  ensureInventoryBalance,
  ensureSupplierOwnership,
  getOwnedLocation,
  getOwnedProduct,
} from "@/lib/services/command-helpers";
import { enqueueRoleNotifications } from "@/lib/services/notification-service";
import { findIdempotentResult, resolveBusinessLocation } from "@/lib/services/platform-service";

const RECEIVABLE_PURCHASE_ORDER_STATUSES: PurchaseOrderStatus[] = [
  PurchaseOrderStatus.sent,
  PurchaseOrderStatus.accepted,
  PurchaseOrderStatus.shipped,
  PurchaseOrderStatus.partially_received,
];

type PurchaseOrderValues = z.infer<typeof purchaseOrderSchema>;
type ReceivedPurchaseOrderValues = z.infer<typeof receivePurchaseOrderSchema>;
type SupplierPortalSupplier = Prisma.SupplierGetPayload<{
  include: {
    business: true;
    organization: true;
  };
}>;

function buildSupplierPortalOrganization(primarySupplier: SupplierPortalSupplier) {
  if (primarySupplier.organization) {
    return {
      id: primarySupplier.organization.id,
      name: primarySupplier.organization.name,
      email: primarySupplier.organization.email,
      phone: primarySupplier.organization.phone,
      notes: primarySupplier.organization.notes,
    };
  }

  return {
    id: primarySupplier.id,
    name: primarySupplier.name,
    email: primarySupplier.email,
    phone: primarySupplier.phone,
    notes: primarySupplier.notes,
  };
}

async function loadSupplierProductsForOrder(
  tx: Prisma.TransactionClient,
  supplierId: string,
  supplierProductIds: string[]
) {
  const supplierProducts = await tx.supplierProduct.findMany({
    where: {
      id: { in: supplierProductIds },
      supplierId,
      isActive: true,
    },
  });

  if (supplierProducts.length !== supplierProductIds.length) {
    throw notFoundError("One or more supplier products could not be found.");
  }

  return new Map(supplierProducts.map((item) => [item.id, item]));
}

function getPurchaseOrderFinancials(
  values: PurchaseOrderValues,
  supplierProductMap: Map<
    string,
    {
      id: string;
      name: string;
      minimumOrderQuantity: Prisma.Decimal;
      wholesalePrice: Prisma.Decimal;
      mappedProductId: string | null;
      deliveryFee: Prisma.Decimal | null;
    }
  >
) {
  const subtotal = values.items.reduce((sum, item) => {
    const supplierProduct = supplierProductMap.get(item.supplierProductId)!;
    if (item.quantity < Number(supplierProduct.minimumOrderQuantity)) {
      throw validationError(
        `Quantity for ${supplierProduct.name} is below the supplier minimum order quantity.`,
        {
          fieldErrors: {
            items: [
              `Quantity for ${supplierProduct.name} is below the supplier minimum order quantity.`,
            ],
          },
        }
      );
    }
    return sum + item.quantity * Number(supplierProduct.wholesalePrice);
  }, 0);

  const shippingAmount = Number(
    supplierProductMap.get(values.items[0]?.supplierProductId ?? "")?.deliveryFee ?? 0
  );

  return {
    subtotal,
    shippingAmount,
    totalCost: subtotal + shippingAmount,
  };
}

async function createPurchaseOrderRecord(
  tx: Prisma.TransactionClient,
  actorUserId: string,
  businessId: string,
  values: PurchaseOrderValues
) {
  await ensureSupplierOwnership(tx, businessId, values.supplierId);
  await getOwnedLocation(tx, businessId, values.locationId);

  const supplierProductMap = await loadSupplierProductsForOrder(
    tx,
    values.supplierId,
    values.items.map((item) => item.supplierProductId)
  );
  const financials = getPurchaseOrderFinancials(values, supplierProductMap);

  return tx.purchaseOrder.create({
    data: {
      businessId,
      supplierId: values.supplierId,
      locationId: values.locationId,
      poNumber: await allocatePurchaseOrderNumber(tx, businessId),
      createdByManagerId: actorUserId,
      status: PurchaseOrderStatus.sent,
      subtotalAmount: toDecimal(financials.subtotal),
      shippingAmount: toDecimal(financials.shippingAmount),
      taxAmount: toDecimal(0),
      totalCost: toDecimal(financials.totalCost),
      expectedDeliveryDate: values.expectedDeliveryDate
        ? new Date(values.expectedDeliveryDate)
        : null,
      items: {
        create: values.items.map((item) => {
          const supplierProduct = supplierProductMap.get(item.supplierProductId)!;
          if (!supplierProduct.mappedProductId) {
            throw validationError(
              `Supplier product ${supplierProduct.name} must be linked to a retail product before ordering.`,
              {
                fieldErrors: {
                  items: [
                    `Supplier product ${supplierProduct.name} must be linked to a retail product before ordering.`,
                  ],
                },
              }
            );
          }

          return {
            supplierProductId: supplierProduct.id,
            productId: supplierProduct.mappedProductId,
            orderedQuantity: toDecimal(item.quantity),
            unitCost: supplierProduct.wholesalePrice,
          };
        }),
      },
    },
    include: {
      supplier: true,
      items: {
        include: {
          product: true,
          supplierProduct: true,
        },
      },
    },
  });
}

function assertReceivablePurchaseOrderStatus(status: PurchaseOrderStatus) {
  if (!RECEIVABLE_PURCHASE_ORDER_STATUSES.includes(status)) {
    throw validationError(
      "Only sent, accepted, shipped, or partially received purchase orders can be received."
    );
  }
}

async function applyPurchaseOrderReceipt(
  tx: Prisma.TransactionClient,
  actorUserId: string,
  purchaseOrder: Prisma.PurchaseOrderGetPayload<{ include: { items: true } }>,
  values: ReceivedPurchaseOrderValues
) {
  assertReceivablePurchaseOrderStatus(purchaseOrder.status);

  const hasPositiveReceipt = values.items.some((item) => item.receivedQuantity > 0);
  if (!hasPositiveReceipt) {
    throw validationError("At least one received quantity must be greater than zero.", {
      fieldErrors: {
        items: ["At least one received quantity must be greater than zero."],
      },
    });
  }

  for (const line of values.items) {
    const item = purchaseOrder.items.find((entry) => entry.id === line.itemId);
    if (!item || line.receivedQuantity <= 0) {
      continue;
    }

    const remainingQuantity = Number(item.orderedQuantity) - Number(item.receivedQuantity);
    if (line.receivedQuantity > remainingQuantity) {
      throw validationError("Received quantity cannot exceed the remaining ordered quantity.", {
        fieldErrors: {
          items: ["Received quantity cannot exceed the remaining ordered quantity."],
        },
      });
    }

    const balance = await ensureInventoryBalance(tx, {
      productId: item.productId,
      locationId: purchaseOrder.locationId,
    });

    const nextOnHand = Number(balance.onHandQuantity) + line.receivedQuantity;
    await tx.inventoryBalance.update({
      where: {
        productId_locationId: {
          productId: item.productId,
          locationId: purchaseOrder.locationId,
        },
      },
      data: {
        onHandQuantity: toDecimal(nextOnHand),
        availableQuantity: toDecimal(
          computeAvailableQuantity(nextOnHand, Number(balance.reservedQuantity))
        ),
        versionNumber: { increment: 1 },
      },
    });

    await tx.inventoryMovement.create({
      data: {
        productId: item.productId,
        locationId: purchaseOrder.locationId,
        movementType: InventoryMovementType.purchase_receive,
        quantityDelta: toDecimal(line.receivedQuantity),
        referenceType: "purchase_order",
        referenceId: purchaseOrder.id,
        reason: "goods_received",
        createdById: actorUserId,
      },
    });

    await tx.purchaseOrderItem.update({
      where: { id: item.id },
      data: {
        receivedQuantity: toDecimal(Number(item.receivedQuantity) + line.receivedQuantity),
      },
    });
  }

  const refreshed = await tx.purchaseOrder.findUniqueOrThrow({
    where: { id: purchaseOrder.id },
    include: { items: true, supplier: true },
  });
  const totalOrdered = refreshed.items.reduce((sum, item) => sum + Number(item.orderedQuantity), 0);
  const totalReceived = refreshed.items.reduce(
    (sum, item) => sum + Number(item.receivedQuantity),
    0
  );
  const status =
    totalReceived >= totalOrdered
      ? PurchaseOrderStatus.received
      : PurchaseOrderStatus.partially_received;

  return tx.purchaseOrder.update({
    where: { id: purchaseOrder.id },
    data: { status },
    include: {
      supplier: true,
      items: {
        include: {
          product: true,
          supplierProduct: true,
        },
      },
    },
  });
}

export async function listProcurementData(businessId: string, locationId?: string) {
  const location = await resolveBusinessLocation(businessId, locationId);
  const [suppliers, supplierProducts, purchaseOrders] = await Promise.all([
    db.supplier.findMany({
      where: { businessId },
      orderBy: { name: "asc" },
    }),
    db.supplierProduct.findMany({
      where: {
        supplier: {
          businessId,
        },
        isActive: true,
      },
      include: {
        supplier: true,
        mappedProduct: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.purchaseOrder.findMany({
      where: { businessId },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
            supplierProduct: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { location, suppliers, supplierProducts, purchaseOrders };
}

export async function createSupplierProduct(
  actorUserId: string,
  businessId: string,
  supplierId: string,
  input: unknown
) {
  const values = supplierProductSchema.parse(input);

  return db.$transaction(async (tx) => {
    await ensureSupplierOwnership(tx, businessId, supplierId);
    if (values.mappedProductId) {
      await getOwnedProduct(tx, businessId, values.mappedProductId);
    }

    const supplierProduct = await tx.supplierProduct.create({
      data: {
        supplierId,
        mappedProductId: values.mappedProductId || null,
        name: values.name,
        description: values.description || null,
        minimumOrderQuantity: toDecimal(values.minimumOrderQuantity),
        casePackSize: values.casePackSize ?? null,
        wholesalePrice: toDecimal(values.wholesalePrice),
        leadTimeDays: values.leadTimeDays,
        deliveryFee: values.deliveryFee != null ? toDecimal(values.deliveryFee) : null,
        serviceArea: values.serviceArea || null,
        imageUrl: values.imageUrl || null,
      },
    });

    await logAudit({
      tx,
      businessId,
      actorUserId,
      action: "supplier_product_created",
      resourceType: "supplier_product",
      resourceId: supplierProduct.id,
      metadata: { name: supplierProduct.name },
    });

    return supplierProduct;
  });
}

export async function createPurchaseOrder(actorUserId: string, businessId: string, input: unknown) {
  const values = purchaseOrderSchema.parse(input);
  const existing = await findIdempotentResult(
    businessId,
    "purchase_order_create",
    values.idempotencyKey
  );
  if (existing) {
    return db.purchaseOrder.findUniqueOrThrow({
      where: { id: existing.resourceId },
      include: { items: true, supplier: true },
    });
  }

  return db.$transaction(async (tx) => {
    const purchaseOrder = await createPurchaseOrderRecord(tx, actorUserId, businessId, values);

    await createIdempotencyRecord(
      tx,
      businessId,
      "purchase_order_create",
      values.idempotencyKey,
      "purchase_order",
      purchaseOrder.id
    );

    await logAudit({
      tx,
      businessId,
      actorUserId,
      action: "purchase_order_created",
      resourceType: "purchase_order",
      resourceId: purchaseOrder.id,
      metadata: { poNumber: purchaseOrder.poNumber },
    });

    await enqueueRoleNotifications(tx, {
      businessId,
      roles: ["owner"],
      type: "purchase_order_created",
      title: "Purchase order created",
      message: `Purchase order ${purchaseOrder.poNumber} was created for ${purchaseOrder.supplier.name}.`,
      channel: "in_app",
    });

    return purchaseOrder;
  });
}

export async function quickReceivePurchaseOrder(
  actorUserId: string,
  businessId: string,
  input: unknown
) {
  const values = purchaseOrderSchema.parse(input);
  const existing = await findIdempotentResult(
    businessId,
    "purchase_order_quick_receive",
    values.idempotencyKey
  );
  if (existing) {
    return db.purchaseOrder.findUniqueOrThrow({
      where: { id: existing.resourceId },
      include: { items: true, supplier: true },
    });
  }

  return db.$transaction(
    async (tx) => {
      const purchaseOrder = await createPurchaseOrderRecord(tx, actorUserId, businessId, values);

      await logAudit({
        tx,
        businessId,
        actorUserId,
        action: "purchase_order_created",
        resourceType: "purchase_order",
        resourceId: purchaseOrder.id,
        metadata: { poNumber: purchaseOrder.poNumber, mode: "quick_receive" },
      });

      await enqueueRoleNotifications(tx, {
        businessId,
        roles: ["owner"],
        type: "purchase_order_created",
        title: "Purchase order created",
        message: `Purchase order ${purchaseOrder.poNumber} was created for ${purchaseOrder.supplier.name}.`,
        channel: "in_app",
      });

      const received = await applyPurchaseOrderReceipt(tx, actorUserId, purchaseOrder, {
        items: purchaseOrder.items.map((item) => ({
          itemId: item.id,
          receivedQuantity: Number(item.orderedQuantity),
        })),
        idempotencyKey: values.idempotencyKey,
      });

      await createIdempotencyRecord(
        tx,
        businessId,
        "purchase_order_quick_receive",
        values.idempotencyKey,
        "purchase_order",
        received.id
      );

      await logAudit({
        tx,
        businessId,
        actorUserId,
        action: "purchase_order_received",
        resourceType: "purchase_order",
        resourceId: received.id,
        metadata: { poNumber: received.poNumber, mode: "quick_receive" },
      });

      await enqueueRoleNotifications(tx, {
        businessId,
        roles: ["owner", "manager"],
        type: "purchase_order_received",
        title: "Purchase order received",
        message: `Purchase order ${received.poNumber} was received into inventory.`,
        channel: "in_app",
      });

      return received;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );
}

export async function receivePurchaseOrder(
  actorUserId: string,
  businessId: string,
  purchaseOrderId: string,
  input: unknown
) {
  const values = receivePurchaseOrderSchema.parse(input);
  const existing = await findIdempotentResult(
    businessId,
    "purchase_order_receive",
    values.idempotencyKey
  );
  if (existing) {
    return db.purchaseOrder.findUniqueOrThrow({
      where: { id: existing.resourceId },
      include: { items: true, supplier: true },
    });
  }

  return db.$transaction(async (tx) => {
    const purchaseOrder = await tx.purchaseOrder.findFirst({
      where: {
        id: purchaseOrderId,
        businessId,
      },
      include: {
        items: true,
      },
    });

    if (!purchaseOrder) {
      throw notFoundError("Purchase order not found.");
    }

    const updated = await applyPurchaseOrderReceipt(tx, actorUserId, purchaseOrder, values);

    await createIdempotencyRecord(
      tx,
      businessId,
      "purchase_order_receive",
      values.idempotencyKey,
      "purchase_order",
      updated.id
    );

    await logAudit({
      tx,
      businessId,
      actorUserId,
      action: "purchase_order_received",
      resourceType: "purchase_order",
      resourceId: updated.id,
      metadata: { poNumber: updated.poNumber },
    });

    await enqueueRoleNotifications(tx, {
      businessId,
      roles: ["owner", "manager"],
      type: "purchase_order_received",
      title: "Purchase order received",
      message: `Purchase order ${updated.poNumber} was received into inventory.`,
      channel: "in_app",
    });

    return updated;
  });
}

export async function getSupplierPortalContext(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      managedSupplier: {
        include: {
          business: true,
          organization: true,
        },
      },
      supplierOrganization: {
        include: {
          suppliers: {
            include: {
              business: true,
              organization: true,
            },
            orderBy: [{ createdAt: "asc" }],
          },
        },
      },
    },
  });

  const supplierMap = new Map<string, SupplierPortalSupplier>();
  for (const supplier of user?.supplierOrganization?.suppliers ?? []) {
    supplierMap.set(supplier.id, supplier);
  }
  if (user?.managedSupplier) {
    supplierMap.set(user.managedSupplier.id, user.managedSupplier);
  }

  const suppliers = Array.from(supplierMap.values());
  const primarySupplier =
    suppliers.find((supplier) => supplier.id === user?.supplierId) ?? suppliers[0] ?? null;

  if (!user || !primarySupplier) {
    throw notFoundError("Supplier profile not found for this account.");
  }

  return {
    user,
    suppliers,
    supplierIds: suppliers.map((supplier) => supplier.id),
    primarySupplier,
    supplierOrganization: buildSupplierPortalOrganization(primarySupplier),
    primaryBusinessId: primarySupplier.businessId,
  };
}

export async function listSupplierPortalData(
  userId: string,
  options?: { relationshipSupplierId?: string | null }
) {
  const context = await getSupplierPortalContext(userId);
  const selectedRelationship = options?.relationshipSupplierId
    ? (context.suppliers.find((supplier) => supplier.id === options.relationshipSupplierId) ?? null)
    : null;

  const [allSupplierProducts, allPurchaseOrders] = await Promise.all([
    db.supplierProduct.findMany({
      where: {
        supplierId: {
          in: context.supplierIds,
        },
      },
      include: {
        mappedProduct: true,
        supplier: {
          include: {
            business: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    }),
    db.purchaseOrder.findMany({
      where: {
        supplierId: {
          in: context.supplierIds,
        },
      },
      include: {
        business: true,
        supplier: {
          include: {
            business: true,
          },
        },
        items: {
          include: {
            product: true,
            supplierProduct: true,
          },
        },
        location: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const visibleSupplierIds = selectedRelationship ? [selectedRelationship.id] : context.supplierIds;
  const supplierProducts = allSupplierProducts.filter((product) =>
    visibleSupplierIds.includes(product.supplierId)
  );
  const purchaseOrders = allPurchaseOrders.filter((purchaseOrder) =>
    visibleSupplierIds.includes(purchaseOrder.supplierId)
  );
  const relationshipSummaries = context.suppliers.map((supplier) => ({
    id: supplier.id,
    supplierName: supplier.name,
    businessName: supplier.business.businessName,
    productsCount: allSupplierProducts.filter((product) => product.supplierId === supplier.id)
      .length,
    ordersCount: allPurchaseOrders.filter(
      (purchaseOrder) => purchaseOrder.supplierId === supplier.id
    ).length,
    openOrdersCount: allPurchaseOrders.filter(
      (purchaseOrder) =>
        purchaseOrder.supplierId === supplier.id &&
        !["received", "closed", "cancelled"].includes(purchaseOrder.status)
    ).length,
  }));
  const activeRelationship = selectedRelationship ?? context.primarySupplier;

  return {
    supplier: context.primarySupplier,
    supplierOrganization: context.supplierOrganization,
    supplierRelationships: context.suppliers,
    relationshipSummaries,
    activeRelationship,
    showingAllRelationships: selectedRelationship == null,
    supplierIds: context.supplierIds,
    defaultBusinessId: activeRelationship.businessId,
    supplierProducts,
    purchaseOrders,
  };
}

export async function updateSupplierPurchaseOrderStatus(
  userId: string,
  purchaseOrderId: string,
  input: unknown
) {
  const values = supplierOrderStatusSchema.parse(input);
  const context = await getSupplierPortalContext(userId);

  const purchaseOrder = await db.purchaseOrder.findFirst({
    where: {
      id: purchaseOrderId,
      supplierId: {
        in: context.supplierIds,
      },
    },
  });

  if (!purchaseOrder) {
    throw notFoundError("Purchase order not found.");
  }

  return db.$transaction(async (tx) => {
    let nextStatus: PurchaseOrderStatus;

    if (values.status === "accepted") {
      if (purchaseOrder.status !== PurchaseOrderStatus.sent) {
        throw validationError("Only sent purchase orders can be accepted by the supplier.");
      }
      nextStatus = PurchaseOrderStatus.accepted;
    } else if (values.status === "rejected") {
      if (purchaseOrder.status !== PurchaseOrderStatus.sent) {
        throw validationError("Only sent purchase orders can be rejected by the supplier.");
      }
      nextStatus = PurchaseOrderStatus.rejected;
    } else {
      if (purchaseOrder.status !== PurchaseOrderStatus.accepted) {
        throw validationError("Only accepted purchase orders can be marked as shipped.");
      }
      nextStatus = PurchaseOrderStatus.shipped;
    }

    const updated = await tx.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        status: nextStatus,
        trackingNumber:
          values.status === "shipped"
            ? values.trackingNumber?.trim() || null
            : purchaseOrder.trackingNumber,
        shippedAt: values.status === "shipped" ? new Date() : purchaseOrder.shippedAt,
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
            supplierProduct: true,
          },
        },
      },
    });

    await logAudit({
      tx,
      businessId: updated.businessId,
      actorUserId: userId,
      action: "supplier_purchase_order_updated",
      resourceType: "purchase_order",
      resourceId: updated.id,
      metadata: { status: nextStatus, trackingNumber: values.trackingNumber?.trim() || null },
    });

    return updated;
  });
}
