import { InventoryMovementType, Prisma, type UserRole } from "@prisma/client";

import { db } from "@/lib/db";
import { conflictError, notFoundError, validationError } from "@/lib/errors";
import { computeAvailableQuantity } from "@/lib/domain/inventory";
import { formatOrderNumber, formatPurchaseOrderNumber, formatReceiptNumber } from "@/lib/domain/sales";
import { toDecimal } from "@/lib/money";

export async function getOwnedLocation(tx: Prisma.TransactionClient, businessId: string, locationId: string) {
  const location = await tx.location.findFirst({
    where: {
      id: locationId,
      businessId,
      isActive: true
    }
  });

  if (!location) {
    throw notFoundError("Location not found for this business.");
  }

  return location;
}

export async function getOwnedProduct(tx: Prisma.TransactionClient, businessId: string, productId: string) {
  const product = await tx.product.findFirst({
    where: {
      id: productId,
      businessId,
      isArchived: false
    },
    include: {
      inventoryBalances: true
    }
  });

  if (!product) {
    throw notFoundError("Product not found for this business.");
  }

  return product;
}

export async function ensureSupplierOwnership(tx: Prisma.TransactionClient, businessId: string, supplierId?: string | null) {
  if (!supplierId) {
    return null;
  }

  const supplier = await tx.supplier.findFirst({
    where: {
      id: supplierId,
      businessId
    }
  });

  if (!supplier) {
    throw notFoundError("Supplier not found for this business.");
  }

  return supplier;
}

export async function findIdempotencyRecord(businessId: string, operation: string, key: string) {
  return db.idempotencyKey.findUnique({
    where: {
      businessId_operation_key: {
        businessId,
        operation,
        key
      }
    }
  });
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
        resourceId
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw conflictError("This request has already been processed. Refresh the page before retrying.", "IDEMPOTENCY_CONFLICT");
    }
    throw error;
  }
}

export async function allocateReceiptNumber(tx: Prisma.TransactionClient, businessId: string) {
  const business = await tx.business.findUniqueOrThrow({
    where: { id: businessId }
  });
  const receiptNumber = formatReceiptNumber(business.nextReceiptNumber);
  await tx.business.update({
    where: { id: businessId },
    data: { nextReceiptNumber: { increment: 1 } }
  });
  return receiptNumber;
}

export async function allocateOrderNumber(tx: Prisma.TransactionClient, businessId: string) {
  const business = await tx.business.findUniqueOrThrow({
    where: { id: businessId }
  });
  const orderNumber = formatOrderNumber(business.nextOrderNumber);
  await tx.business.update({
    where: { id: businessId },
    data: { nextOrderNumber: { increment: 1 } }
  });
  return orderNumber;
}

export async function allocatePurchaseOrderNumber(tx: Prisma.TransactionClient, businessId: string) {
  const business = await tx.business.findUniqueOrThrow({
    where: { id: businessId }
  });
  const poNumber = formatPurchaseOrderNumber(business.nextPurchaseOrderNumber);
  await tx.business.update({
    where: { id: businessId },
    data: { nextPurchaseOrderNumber: { increment: 1 } }
  });
  return poNumber;
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
        locationId: input.locationId
      }
    }
  });

  const availableQuantity = Number(balance.availableQuantity);
  if (!input.allowOversell && availableQuantity < input.quantity) {
    throw conflictError("Inventory changed while reserving this cart. Please review item availability before continuing.", "STALE_INVENTORY");
  }

  const updated = input.allowOversell
    ? await tx.inventoryBalance.update({
        where: {
          productId_locationId: {
            productId: input.productId,
            locationId: input.locationId
          }
        },
        data: {
          reservedQuantity: toDecimal(Number(balance.reservedQuantity) + input.quantity),
          availableQuantity: toDecimal(availableQuantity - input.quantity),
          versionNumber: { increment: 1 }
        }
      })
    : null;

  if (!input.allowOversell) {
    const optimistic = await tx.inventoryBalance.updateMany({
      where: {
        productId: input.productId,
        locationId: input.locationId,
        versionNumber: balance.versionNumber,
        availableQuantity: { gte: input.quantity }
      },
      data: {
        reservedQuantity: toDecimal(Number(balance.reservedQuantity) + input.quantity),
        availableQuantity: toDecimal(availableQuantity - input.quantity),
        versionNumber: { increment: 1 }
      }
    });

    if (optimistic.count !== 1) {
      throw conflictError("Inventory changed while reserving this cart. Please review item availability before continuing.", "STALE_INVENTORY");
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
      createdById: input.createdById
    }
  });

  return updated;
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
        locationId: input.locationId
      }
    }
  });

  await tx.inventoryBalance.update({
    where: {
      productId_locationId: {
        productId: input.productId,
        locationId: input.locationId
      }
    },
    data: {
      reservedQuantity: toDecimal(Math.max(Number(balance.reservedQuantity) - input.quantity, 0)),
      availableQuantity: toDecimal(Number(balance.availableQuantity) + input.quantity),
      versionNumber: { increment: 1 }
    }
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
      createdById: input.createdById
    }
  });
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
        locationId: input.locationId
      }
    }
  });

  if (Number(balance.reservedQuantity) < input.quantity) {
    throw conflictError("The reserved inventory no longer matches this cart. Please rebuild the cart and try again.", "STALE_INVENTORY");
  }

  const nextOnHand = Number(balance.onHandQuantity) - input.quantity;
  await tx.inventoryBalance.update({
    where: {
      productId_locationId: {
        productId: input.productId,
        locationId: input.locationId
      }
    },
    data: {
      onHandQuantity: toDecimal(nextOnHand),
      reservedQuantity: toDecimal(Number(balance.reservedQuantity) - input.quantity),
      availableQuantity: toDecimal(computeAvailableQuantity(nextOnHand, Number(balance.reservedQuantity) - input.quantity)),
      versionNumber: { increment: 1 }
    }
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
      createdById: input.createdById
    }
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
  }
) {
  const balance = await tx.inventoryBalance.findUniqueOrThrow({
    where: {
      productId_locationId: {
        productId: input.productId,
        locationId: input.locationId
      }
    }
  });
  const nextOnHand = Number(balance.onHandQuantity) + input.quantity;
  await tx.inventoryBalance.update({
    where: {
      productId_locationId: {
        productId: input.productId,
        locationId: input.locationId
      }
    },
    data: {
      onHandQuantity: toDecimal(nextOnHand),
      availableQuantity: toDecimal(Number(balance.availableQuantity) + input.quantity),
      versionNumber: { increment: 1 }
    }
  });
  await tx.inventoryMovement.create({
    data: {
      productId: input.productId,
      locationId: input.locationId,
      movementType: InventoryMovementType.refund_restock,
      quantityDelta: toDecimal(input.quantity),
      referenceType: "refund",
      referenceId: input.referenceId,
      reason: input.reason,
      createdById: input.createdById
    }
  });
}

export function requireRoleAccess(role: UserRole, allowedRoles: UserRole[]) {
  if (!allowedRoles.includes(role)) {
    throw validationError("This action is not allowed for your role.");
  }
}
