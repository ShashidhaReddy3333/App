import { InventoryMovementType } from "@prisma/client";

import { logAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { computeAvailableQuantity, computeReorderQuantity } from "@/lib/domain/inventory";
import { notFoundError, validationError } from "@/lib/errors";
import { toDecimal } from "@/lib/money";
import {
  inventoryAdjustmentSchema,
  inventoryTransferSchema,
  productSchema,
  supplierSchema,
} from "@/lib/schemas/catalog";
import {
  createIdempotencyRecord,
  ensureInventoryBalance,
  ensureSupplierOwnership,
  getOwnedLocation,
  getOwnedProduct,
} from "@/lib/services/command-helpers";
import {
  findIdempotentResult,
  listBusinessLocations,
  resolveBusinessLocation,
} from "@/lib/services/platform-service";

export async function listCatalogData(
  businessId: string,
  options?: { page?: number; pageSize?: number; locationId?: string }
) {
  const location = await resolveBusinessLocation(businessId, options?.locationId);
  const where = { businessId, isArchived: false };
  const suppliersPromise = db.supplier.findMany({
    where: { businessId },
    orderBy: { name: "asc" },
  });
  const locationsPromise = listBusinessLocations(businessId);

  if (typeof options?.page === "number" || typeof options?.pageSize === "number") {
    const page = Math.max(1, options?.page ?? 1);
    const pageSize = Math.max(1, options?.pageSize ?? 20);
    const skip = (page - 1) * pageSize;

    const [products, totalCount, allProducts, suppliers, locations] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          supplier: true,
          inventoryBalances: {
            where: { locationId: location.id },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      db.product.count({ where }),
      db.product.findMany({
        where,
        include: {
          supplier: true,
          inventoryBalances: {
            where: { locationId: location.id },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      suppliersPromise,
      locationsPromise,
    ]);

    return {
      location,
      locations,
      products: products.map((product) => {
        const balance = product.inventoryBalances[0];
        const availableQuantity = balance ? Number(balance.availableQuantity) : 0;
        return {
          ...product,
          availableQuantity,
          reorderQuantity: computeReorderQuantity(Number(product.parLevel), availableQuantity),
        };
      }),
      allProducts: allProducts.map((product) => {
        const balance = product.inventoryBalances[0];
        const availableQuantity = balance ? Number(balance.availableQuantity) : 0;
        return {
          ...product,
          availableQuantity,
          reorderQuantity: computeReorderQuantity(Number(product.parLevel), availableQuantity),
        };
      }),
      suppliers,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
    };
  }

  const [products, suppliers, locations] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        supplier: true,
        inventoryBalances: {
          where: { locationId: location.id },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    suppliersPromise,
    locationsPromise,
  ]);

  const mappedProducts = products.map((product) => {
    const balance = product.inventoryBalances[0];
    const availableQuantity = balance ? Number(balance.availableQuantity) : 0;
    return {
      ...product,
      availableQuantity,
      reorderQuantity: computeReorderQuantity(Number(product.parLevel), availableQuantity),
    };
  });

  return {
    location,
    locations,
    products: mappedProducts,
    allProducts: mappedProducts,
    suppliers,
    totalCount: mappedProducts.length,
    totalPages: 1,
    currentPage: 1,
  };
}

export async function createSupplier(actorUserId: string, businessId: string, input: unknown) {
  const values = supplierSchema.parse(input);

  return db.$transaction(async (tx) => {
    const supplier = await tx.supplier.create({
      data: {
        businessId,
        name: values.name,
        contactName: values.contactName || null,
        email: values.email || null,
        phone: values.phone || null,
        notes: values.notes || null,
      },
    });

    await logAudit({
      tx,
      businessId,
      actorUserId,
      action: "supplier_created",
      resourceType: "supplier",
      resourceId: supplier.id,
      metadata: { name: supplier.name },
    });

    return supplier;
  });
}

export async function createProduct(actorUserId: string, businessId: string, input: unknown) {
  const values = productSchema.parse(input);

  return db.$transaction(async (tx) => {
    await getOwnedLocation(tx, businessId, values.locationId);
    await ensureSupplierOwnership(tx, businessId, values.supplierId || null);

    const existingSku = await tx.product.findFirst({
      where: {
        businessId,
        sku: values.sku,
      },
    });
    if (existingSku) {
      throw validationError("SKU already exists for this business.", {
        fieldErrors: {
          sku: ["SKU already exists for this business."],
        },
      });
    }

    const product = await tx.product.create({
      data: {
        businessId,
        name: values.name,
        category: values.category,
        sku: values.sku,
        barcode: values.barcode || null,
        supplierId: values.supplierId || null,
        unitType: values.unitType,
        purchasePrice: toDecimal(values.purchasePrice),
        sellingPrice: toDecimal(values.sellingPrice),
        taxCategory: values.taxCategory || null,
        parLevel: toDecimal(values.parLevel),
        allowOversell: values.allowOversell,
      },
    });

    const availableQuantity = computeAvailableQuantity(values.openingStock, 0);

    await tx.inventoryBalance.create({
      data: {
        productId: product.id,
        locationId: values.locationId,
        onHandQuantity: toDecimal(values.openingStock),
        reservedQuantity: toDecimal(0),
        availableQuantity: toDecimal(availableQuantity),
      },
    });

    await tx.inventoryMovement.create({
      data: {
        productId: product.id,
        locationId: values.locationId,
        movementType: InventoryMovementType.stock_count_reconciliation,
        quantityDelta: toDecimal(values.openingStock),
        referenceType: "product",
        referenceId: product.id,
        reason: "opening_stock",
        createdById: actorUserId,
      },
    });

    await logAudit({
      tx,
      businessId,
      actorUserId,
      action: "product_created",
      resourceType: "product",
      resourceId: product.id,
      metadata: { name: product.name, sku: product.sku },
    });

    return product;
  });
}

export async function adjustInventory(actorUserId: string, businessId: string, input: unknown) {
  const values = inventoryAdjustmentSchema.parse(input);
  const existing = await findIdempotentResult(
    businessId,
    "manual_stock_adjustment",
    values.idempotencyKey
  );
  if (existing) {
    return db.inventoryMovement.findUniqueOrThrow({
      where: { id: existing.resourceId },
    });
  }

  const result = await db.$transaction(async (tx) => {
    const product = await getOwnedProduct(tx, businessId, values.productId);
    await getOwnedLocation(tx, businessId, values.locationId);
    const balance = await ensureInventoryBalance(tx, {
      productId: values.productId,
      locationId: values.locationId,
    });

    const nextOnHand = Number(balance.onHandQuantity) + values.quantityDelta;
    if (!product.allowOversell && nextOnHand < 0) {
      throw validationError("Adjustment would reduce stock below zero.", {
        fieldErrors: {
          quantityDelta: ["Adjustment would reduce stock below zero."],
        },
      });
    }

    const nextAvailable = computeAvailableQuantity(nextOnHand, Number(balance.reservedQuantity));
    await tx.inventoryBalance.update({
      where: {
        productId_locationId: {
          productId: values.productId,
          locationId: values.locationId,
        },
      },
      data: {
        onHandQuantity: toDecimal(nextOnHand),
        availableQuantity: toDecimal(nextAvailable),
        versionNumber: { increment: 1 },
      },
    });

    const movement = await tx.inventoryMovement.create({
      data: {
        productId: values.productId,
        locationId: values.locationId,
        movementType:
          values.quantityDelta > 0
            ? InventoryMovementType.manual_adjustment_increase
            : InventoryMovementType.manual_adjustment_decrease,
        quantityDelta: toDecimal(values.quantityDelta),
        referenceType: "stock_adjustment",
        referenceId: values.idempotencyKey,
        reason: values.reason,
        createdById: actorUserId,
      },
    });

    await createIdempotencyRecord(
      tx,
      businessId,
      "manual_stock_adjustment",
      values.idempotencyKey,
      "inventory_movement",
      movement.id
    );

    await logAudit({
      tx,
      businessId,
      actorUserId,
      action: "stock_adjusted",
      resourceType: "inventory_movement",
      resourceId: movement.id,
      metadata: {
        productId: values.productId,
        quantityDelta: values.quantityDelta,
        reason: values.reason,
      },
    });

    return movement;
  });

  return result;
}

export async function transferInventory(actorUserId: string, businessId: string, input: unknown) {
  const values = inventoryTransferSchema.parse(input);
  const existing = await findIdempotentResult(
    businessId,
    "inventory_transfer",
    values.idempotencyKey
  );
  if (existing) {
    return {
      id: existing.resourceId,
      productId: values.productId,
      sourceLocationId: values.sourceLocationId,
      destinationLocationId: values.destinationLocationId,
      quantity: values.quantity,
    };
  }

  return db.$transaction(
    async (tx) => {
      await getOwnedProduct(tx, businessId, values.productId);
      await getOwnedLocation(tx, businessId, values.sourceLocationId);
      await getOwnedLocation(tx, businessId, values.destinationLocationId);

      const sourceBalance = await ensureInventoryBalance(tx, {
        productId: values.productId,
        locationId: values.sourceLocationId,
      });
      const destinationBalance = await ensureInventoryBalance(tx, {
        productId: values.productId,
        locationId: values.destinationLocationId,
      });

      if (Number(sourceBalance.availableQuantity) < values.quantity) {
        throw validationError("Transfer quantity exceeds available stock at the source location.", {
          fieldErrors: {
            quantity: ["Transfer quantity exceeds available stock at the source location."],
          },
        });
      }

      const referenceId = crypto.randomUUID();
      const nextSourceOnHand = Number(sourceBalance.onHandQuantity) - values.quantity;
      const nextDestinationOnHand = Number(destinationBalance.onHandQuantity) + values.quantity;

      await tx.inventoryBalance.update({
        where: {
          productId_locationId: {
            productId: values.productId,
            locationId: values.sourceLocationId,
          },
        },
        data: {
          onHandQuantity: toDecimal(nextSourceOnHand),
          availableQuantity: toDecimal(Number(sourceBalance.availableQuantity) - values.quantity),
          versionNumber: { increment: 1 },
        },
      });

      await tx.inventoryBalance.update({
        where: {
          productId_locationId: {
            productId: values.productId,
            locationId: values.destinationLocationId,
          },
        },
        data: {
          onHandQuantity: toDecimal(nextDestinationOnHand),
          availableQuantity: toDecimal(
            Number(destinationBalance.availableQuantity) + values.quantity
          ),
          versionNumber: { increment: 1 },
        },
      });

      await tx.inventoryMovement.createMany({
        data: [
          {
            productId: values.productId,
            locationId: values.sourceLocationId,
            movementType: InventoryMovementType.transfer_out,
            quantityDelta: toDecimal(-values.quantity),
            referenceType: "inventory_transfer",
            referenceId,
            reason: values.reason,
            createdById: actorUserId,
          },
          {
            productId: values.productId,
            locationId: values.destinationLocationId,
            movementType: InventoryMovementType.transfer_in,
            quantityDelta: toDecimal(values.quantity),
            referenceType: "inventory_transfer",
            referenceId,
            reason: values.reason,
            createdById: actorUserId,
          },
        ],
      });

      await createIdempotencyRecord(
        tx,
        businessId,
        "inventory_transfer",
        values.idempotencyKey,
        "inventory_transfer",
        referenceId
      );

      await logAudit({
        tx,
        businessId,
        actorUserId,
        action: "inventory_transferred",
        resourceType: "inventory_transfer",
        resourceId: referenceId,
        metadata: {
          productId: values.productId,
          sourceLocationId: values.sourceLocationId,
          destinationLocationId: values.destinationLocationId,
          quantity: values.quantity,
        },
      });

      return {
        id: referenceId,
        productId: values.productId,
        sourceLocationId: values.sourceLocationId,
        destinationLocationId: values.destinationLocationId,
        quantity: values.quantity,
      };
    },
    {
      isolationLevel: "Serializable",
    }
  );
}

export async function listReorderItems(businessId: string, locationId?: string) {
  const location = await resolveBusinessLocation(businessId, locationId);

  if (!location) {
    throw notFoundError("Location not found for this business.");
  }

  const balances = await db.inventoryBalance.findMany({
    where: {
      locationId: location.id,
      product: {
        businessId,
        isArchived: false,
      },
    },
    include: {
      product: {
        include: {
          supplier: true,
          supplierProducts: {
            where: { isActive: true },
            orderBy: { updatedAt: "desc" },
            take: 10,
          },
        },
      },
    },
    orderBy: {
      updatedAt: "asc",
    },
  });

  return balances
    .map((balance) => {
      const mappedSupplierProduct =
        balance.product.supplierId == null
          ? null
          : (balance.product.supplierProducts.find(
              (supplierProduct) =>
                supplierProduct.supplierId === balance.product.supplierId &&
                supplierProduct.mappedProductId === balance.productId
            ) ?? null);

      const reorderBlockedReason =
        balance.product.supplierId == null
          ? "Assign a supplier before creating a purchase order."
          : !mappedSupplierProduct
            ? "Link an active supplier catalog item before creating a purchase order."
            : null;

      return {
        productId: balance.productId,
        locationId: location.id,
        productName: balance.product.name,
        supplierId: balance.product.supplierId,
        supplierProductId: mappedSupplierProduct?.id ?? null,
        supplierName: balance.product.supplier?.name ?? "Unassigned",
        availableQuantity: Number(balance.availableQuantity),
        parLevel: Number(balance.product.parLevel),
        suggestedReorderQuantity: computeReorderQuantity(
          Number(balance.product.parLevel),
          Number(balance.availableQuantity)
        ),
        reorderBlockedReason,
      };
    })
    .filter((item) => item.suggestedReorderQuantity > 0);
}
