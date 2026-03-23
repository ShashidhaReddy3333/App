import { InventoryMovementType, Prisma, type UserRole } from "@prisma/client";

import { conflictError, notFoundError, validationError } from "@/lib/errors";
import { computeAvailableQuantity } from "@/lib/domain/inventory";
import {
  formatOrderNumber,
  formatPurchaseOrderNumber,
  formatReceiptNumber,
} from "@/lib/domain/sales";
import { toDecimal } from "@/lib/money";

type BusinessSequenceField = "nextReceiptNumber" | "nextOrderNumber" | "nextPurchaseOrderNumber";

async function allocateBusinessSequenceNumber(
  tx: Prisma.TransactionClient,
  businessId: string,
  column: BusinessSequenceField
) {
  const quotedColumn = Prisma.raw(`"${column}"`);
  const rows = await tx.$queryRaw<Array<{ allocatedNumber: number }>>(Prisma.sql`
    UPDATE "Business"
    SET ${quotedColumn} = ${quotedColumn} + 1
    WHERE id = ${businessId}
    RETURNING ${quotedColumn} - 1 AS "allocatedNumber"
  `);

  const allocatedNumber = rows[0]?.allocatedNumber;
  if (typeof allocatedNumber !== "number") {
    throw notFoundError("Business not found.");
  }

  return allocatedNumber;
}

export async function getOwnedLocation(
  tx: Prisma.TransactionClient,
  businessId: string,
  locationId: string
) {
  const location = await tx.location.findFirst({
    where: {
      id: locationId,
      businessId,
      isActive: true,
    },
  });

  if (!location) {
    throw notFoundError("Location not found for this business.");
  }

  return location;
}

export async function getOwnedProduct(
  tx: Prisma.TransactionClient,
  businessId: string,
  productId: string
) {
  const product = await tx.product.findFirst({
    where: {
      id: productId,
      businessId,
      isArchived: false,
    },
    include: {
      inventoryBalances: true,
    },
  });

  if (!product) {
    throw notFoundError("Product not found for this business.");
  }

  return product;
}

export async function ensureSupplierOwnership(
  tx: Prisma.TransactionClient,
  businessId: string,
  supplierId?: string | null
) {
  if (!supplierId) {
    return null;
  }

  const supplier = await tx.supplier.findFirst({
    where: {
      id: supplierId,
      businessId,
    },
  });

  if (!supplier) {
    throw notFoundError("Supplier not found for this business.");
  }

  return supplier;
}

export async function createIdempotencyRecord(
  tx: Prisma.TransactionClient,
  businessId: string,
  operation: string,
  key: string,
  resourceType: string,
  resourceId: string
) {
  try {
    return await tx.idempotencyKey.create({
      data: {
        businessId,
        key,
        operation,
        resourceType,
        resourceId,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw conflictError(
        "This request has already been processed. Refresh the page before retrying.",
        "IDEMPOTENCY_CONFLICT"
      );
    }
    throw error;
  }
}

export async function allocateReceiptNumber(tx: Prisma.TransactionClient, businessId: string) {
  return formatReceiptNumber(
    await allocateBusinessSequenceNumber(tx, businessId, "nextReceiptNumber")
  );
}

export async function allocateOrderNumber(tx: Prisma.TransactionClient, businessId: string) {
  return formatOrderNumber(await allocateBusinessSequenceNumber(tx, businessId, "nextOrderNumber"));
}

export async function allocatePurchaseOrderNumber(
  tx: Prisma.TransactionClient,
  businessId: string
) {
  return formatPurchaseOrderNumber(
    await allocateBusinessSequenceNumber(tx, businessId, "nextPurchaseOrderNumber")
  );
}

export async function reserveInventory(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    locationId: string;
    quantity: number;
    allowOversell: boolean;
    referenceId: string;
    createdById: string;
    referenceType?: string;
    reason?: string;
  }
) {
  const balance = await tx.inventoryBalance.findUniqueOrThrow({
    where: {
      productId_locationId: {
        productId: input.productId,
        locationId: input.locationId,
      },
    },
  });

  const availableQuantity = Number(balance.availableQuantity);
  if (!input.allowOversell && availableQuantity < input.quantity) {
    throw conflictError(
      "Inventory changed while reserving this cart. Please review item availability before continuing.",
      "STALE_INVENTORY"
    );
  }

  const updated = input.allowOversell
    ? await tx.inventoryBalance.update({
        where: {
          productId_locationId: {
            productId: input.productId,
            locationId: input.locationId,
          },
        },
        data: {
          reservedQuantity: toDecimal(Number(balance.reservedQuantity) + input.quantity),
          availableQuantity: toDecimal(availableQuantity - input.quantity),
          versionNumber: { increment: 1 },
        },
      })
    : null;

  if (!input.allowOversell) {
    const optimistic = await tx.inventoryBalance.updateMany({
      where: {
        productId: input.productId,
        locationId: input.locationId,
        versionNumber: balance.versionNumber,
        availableQuantity: { gte: input.quantity },
      },
      data: {
        reservedQuantity: toDecimal(Number(balance.reservedQuantity) + input.quantity),
        availableQuantity: toDecimal(availableQuantity - input.quantity),
        versionNumber: { increment: 1 },
      },
    });

    if (optimistic.count !== 1) {
      throw conflictError(
        "Inventory changed while reserving this cart. Please review item availability before continuing.",
        "STALE_INVENTORY"
      );
    }
  }

  await tx.inventoryMovement.create({
    data: {
      productId: input.productId,
      locationId: input.locationId,
      movementType: InventoryMovementType.reservation_hold,
      quantityDelta: toDecimal(input.quantity),
      referenceType: input.referenceType ?? "sale",
      referenceId: input.referenceId,
      reason: input.reason ?? "checkout_reservation",
      createdById: input.createdById,
    },
  });

  return updated;
}

export async function ensureInventoryBalance(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    locationId: string;
  }
) {
  const existing = await tx.inventoryBalance.findUnique({
    where: {
      productId_locationId: {
        productId: input.productId,
        locationId: input.locationId,
      },
    },
  });

  if (existing) {
    return existing;
  }

  return tx.inventoryBalance.create({
    data: {
      productId: input.productId,
      locationId: input.locationId,
      onHandQuantity: toDecimal(0),
      reservedQuantity: toDecimal(0),
      availableQuantity: toDecimal(0),
    },
  });
}

export async function releaseReservation(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    locationId: string;
    quantity: number;
    referenceId: string;
    createdById: string;
    reason: string;
    referenceType?: string;
  }
) {
  const balance = await tx.inventoryBalance.findUniqueOrThrow({
    where: {
      productId_locationId: {
        productId: input.productId,
        locationId: input.locationId,
      },
    },
  });

  await tx.inventoryBalance.update({
    where: {
      productId_locationId: {
        productId: input.productId,
        locationId: input.locationId,
      },
    },
    data: {
      reservedQuantity: toDecimal(Math.max(Number(balance.reservedQuantity) - input.quantity, 0)),
      availableQuantity: toDecimal(Number(balance.availableQuantity) + input.quantity),
      versionNumber: { increment: 1 },
    },
  });

  await tx.inventoryMovement.create({
    data: {
      productId: input.productId,
      locationId: input.locationId,
      movementType: InventoryMovementType.reservation_release,
      quantityDelta: toDecimal(-input.quantity),
      referenceType: input.referenceType ?? "sale",
      referenceId: input.referenceId,
      reason: input.reason,
      createdById: input.createdById,
    },
  });
}

/**
 * Batch-release reserved inventory for multiple items at once.
 * Groups items by (productId, locationId) and performs one update + one
 * movement record per group, dramatically reducing query count for bulk
 * operations like expired reservation cleanup.
 */
export async function batchReleaseReservations(
  tx: Prisma.TransactionClient,
  items: Array<{
    productId: string;
    locationId: string;
    quantity: number;
    referenceId: string;
    createdById: string;
    reason: string;
  }>
) {
  // Group items by product+location to aggregate quantities
  const grouped = new Map<
    string,
    { productId: string; locationId: string; totalQuantity: number; items: typeof items }
  >();

  for (const item of items) {
    const key = `${item.productId}:${item.locationId}`;
    const group = grouped.get(key);
    if (group) {
      group.totalQuantity += item.quantity;
      group.items.push(item);
    } else {
      grouped.set(key, {
        productId: item.productId,
        locationId: item.locationId,
        totalQuantity: item.quantity,
        items: [item],
      });
    }
  }

  for (const [, group] of grouped) {
    // Single update per product+location pair
    await tx.inventoryBalance.update({
      where: {
        productId_locationId: {
          productId: group.productId,
          locationId: group.locationId,
        },
      },
      data: {
        reservedQuantity: { decrement: group.totalQuantity },
        availableQuantity: { increment: group.totalQuantity },
        versionNumber: { increment: 1 },
      },
    });

    // One movement record per individual release (for audit trail)
    for (const item of group.items) {
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          locationId: item.locationId,
          movementType: InventoryMovementType.reservation_release,
          quantityDelta: toDecimal(-item.quantity),
          referenceType: "sale",
          referenceId: item.referenceId,
          reason: item.reason,
          createdById: item.createdById,
        },
      });
    }
  }
}

export async function commitReservedInventory(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    locationId: string;
    quantity: number;
    referenceId: string;
    createdById: string;
    referenceType?: string;
    reason?: string;
  }
) {
  const balance = await tx.inventoryBalance.findUniqueOrThrow({
    where: {
      productId_locationId: {
        productId: input.productId,
        locationId: input.locationId,
      },
    },
  });

  if (Number(balance.reservedQuantity) < input.quantity) {
    throw conflictError(
      "The reserved inventory no longer matches this cart. Please rebuild the cart and try again.",
      "STALE_INVENTORY"
    );
  }

  const nextOnHand = Number(balance.onHandQuantity) - input.quantity;
  await tx.inventoryBalance.update({
    where: {
      productId_locationId: {
        productId: input.productId,
        locationId: input.locationId,
      },
    },
    data: {
      onHandQuantity: toDecimal(nextOnHand),
      reservedQuantity: toDecimal(Number(balance.reservedQuantity) - input.quantity),
      availableQuantity: toDecimal(
        computeAvailableQuantity(nextOnHand, Number(balance.reservedQuantity) - input.quantity)
      ),
      versionNumber: { increment: 1 },
    },
  });

  await tx.inventoryMovement.create({
    data: {
      productId: input.productId,
      locationId: input.locationId,
      movementType: InventoryMovementType.sale_commit,
      quantityDelta: toDecimal(-input.quantity),
      referenceType: input.referenceType ?? "sale",
      referenceId: input.referenceId,
      reason: input.reason ?? "sale_completed",
      createdById: input.createdById,
    },
  });
}

export async function restockInventory(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    locationId: string;
    quantity: number;
    referenceId: string;
    createdById: string;
    reason: string;
    referenceType?: string;
    movementType?: InventoryMovementType;
  }
) {
  const balance = await tx.inventoryBalance.findUniqueOrThrow({
    where: {
      productId_locationId: {
        productId: input.productId,
        locationId: input.locationId,
      },
    },
  });
  const nextOnHand = Number(balance.onHandQuantity) + input.quantity;
  await tx.inventoryBalance.update({
    where: {
      productId_locationId: {
        productId: input.productId,
        locationId: input.locationId,
      },
    },
    data: {
      onHandQuantity: toDecimal(nextOnHand),
      availableQuantity: toDecimal(Number(balance.availableQuantity) + input.quantity),
      versionNumber: { increment: 1 },
    },
  });
  await tx.inventoryMovement.create({
    data: {
      productId: input.productId,
      locationId: input.locationId,
      movementType: input.movementType ?? InventoryMovementType.refund_restock,
      quantityDelta: toDecimal(input.quantity),
      referenceType: input.referenceType ?? "refund",
      referenceId: input.referenceId,
      reason: input.reason,
      createdById: input.createdById,
    },
  });
}

export function requireRoleAccess(role: UserRole, allowedRoles: UserRole[]) {
  if (!allowedRoles.includes(role)) {
    throw validationError("This action is not allowed for your role.");
  }
}
