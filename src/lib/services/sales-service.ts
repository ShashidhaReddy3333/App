import { InventoryMovementType, OrderStatus, PaymentStatus, Prisma, PurchaseOrderStatus, RefundStatus, RestockAction, SaleStatus } from "@prisma/client";

import { logAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { priceCheckout } from "@/lib/domain/pricing";
import { sumSuccessfulPayments } from "@/lib/domain/sales";
import { conflictError, notFoundError, validationError } from "@/lib/errors";
import { roundMoney, toDecimal } from "@/lib/money";
import { checkoutSchema, completeSaleSchema, refundSchema } from "@/lib/schemas/sales";
import { findIdempotentResult } from "@/lib/services/platform-service";
import {
  allocateReceiptNumber,
  commitReservedInventory,
  createIdempotencyRecord,
  getOwnedLocation,
  releaseReservation,
  reserveInventory,
  restockInventory
} from "@/lib/services/command-helpers";
import { formatBusinessDateStamp, getBusinessDayRange, zonedDateTimeToUtc } from "@/lib/timezone";

function taxRateCategories(value: Prisma.JsonValue | null) {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.filter((item): item is string => typeof item === "string");
}

export async function releaseExpiredReservations(tx: Prisma.TransactionClient, businessId: string) {
  const expiredSales = await tx.sale.findMany({
    where: {
      businessId,
      status: SaleStatus.pending_payment,
      reservationExpiresAt: { lt: new Date() }
    },
    include: {
      items: true
    }
  });

  for (const sale of expiredSales) {
    for (const item of sale.items) {
      await releaseReservation(tx, {
        productId: item.productId,
        locationId: sale.locationId,
        quantity: Number(item.quantity),
        referenceId: sale.id,
        createdById: sale.cashierUserId,
        reason: "reservation_expired"
      });
    }

    await tx.sale.update({
      where: { id: sale.id },
      data: {
        status: SaleStatus.cancelled,
        reservationExpiresAt: null
      }
    });
  }

  return expiredSales.length;
}

export async function cleanupExpiredReservations(businessId?: string) {
  return db.$transaction(
    async (tx) => {
      const businesses = businessId
        ? [{ id: businessId }]
        : await tx.business.findMany({
            where: { isActive: true },
            select: { id: true }
          });

      let salesCancelled = 0;
      for (const business of businesses) {
        salesCancelled += await releaseExpiredReservations(tx, business.id);
      }

      return {
        businessesProcessed: businesses.length,
        salesCancelled
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }
  );
}

export async function createCheckoutDraft(actorUserId: string, businessId: string, input: unknown) {
  const values = checkoutSchema.parse(input);

  return db.$transaction(
    async (tx) => {
      await releaseExpiredReservations(tx, businessId);

      const business = await tx.business.findUniqueOrThrow({
        where: { id: businessId },
        include: { taxRates: true }
      });
      await getOwnedLocation(tx, businessId, values.locationId);

      const products = await tx.product.findMany({
        where: {
          id: { in: values.items.map((item) => item.productId) },
          businessId,
          isArchived: false
        },
        include: {
          inventoryBalances: {
            where: { locationId: values.locationId }
          }
        }
      });

      const productMap = new Map(products.map((product) => [product.id, product]));
      const pricing = priceCheckout(
        values.items.map((item) => {
          const product = productMap.get(item.productId);
          if (!product) {
            throw notFoundError("One or more products could not be found.");
          }
          return {
            productId: product.id,
            productName: product.name,
            category: product.category,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount
          };
        }),
        business.taxRates.map((rate) => ({
          name: rate.name,
          ratePercent: Number(rate.ratePercent),
          appliesToCategories: taxRateCategories(rate.appliesToCategories),
          compoundOrder: rate.compoundOrder
        })),
        business.taxMode,
        values.saleDiscount
      );

      const sale = await tx.sale.create({
        data: {
          businessId,
          locationId: values.locationId,
          cashierUserId: actorUserId,
          status: SaleStatus.pending_payment,
          subtotalAmount: toDecimal(pricing.subtotalAmount),
          discountAmount: toDecimal(pricing.discountAmount),
          taxAmount: toDecimal(pricing.taxAmount),
          totalAmount: toDecimal(pricing.totalAmount),
          amountDue: toDecimal(pricing.totalAmount),
          saleDiscountType: values.saleDiscount?.type ?? null,
          saleDiscountValue: values.saleDiscount ? toDecimal(values.saleDiscount.value) : null,
          saleDiscountReason: values.saleDiscount?.reason ?? null,
          reservationExpiresAt: new Date(Date.now() + business.reservationDurationMinutes * 60 * 1000)
        }
      });

      for (const line of pricing.items) {
        const product = productMap.get(line.productId)!;
        if (!product.inventoryBalances[0]) {
          throw conflictError(`Inventory balance is missing for ${product.name}.`, "STALE_INVENTORY");
        }

        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: line.productId,
            quantity: toDecimal(line.quantity),
            unitPrice: toDecimal(line.unitPrice),
            subtotal: toDecimal(line.subtotal),
            lineDiscountAmount: toDecimal(line.lineDiscount),
            allocatedSaleDiscountAmount: toDecimal(line.allocatedSaleDiscount),
            taxAmount: toDecimal(line.taxAmount),
            taxComponents: line.taxComponents as Prisma.InputJsonValue,
            lineTotal: toDecimal(line.lineTotal)
          }
        });

        await reserveInventory(tx, {
          productId: line.productId,
          locationId: values.locationId,
          quantity: line.quantity,
          allowOversell: product.allowOversell,
          referenceId: sale.id,
          createdById: actorUserId
        });
      }

      return tx.sale.findUniqueOrThrow({
        where: { id: sale.id },
        include: { items: true }
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }
  );
}

export async function completeSale(actorUserId: string, businessId: string, saleId: string, input: unknown) {
  const values = completeSaleSchema.parse(input);
  const existing = await findIdempotentResult(businessId, "complete_sale", values.idempotencyKey);
  if (existing) {
    return db.sale.findUniqueOrThrow({
      where: { id: existing.resourceId },
      include: { items: true, payments: true }
    });
  }

  const sale = await db.$transaction(
    async (tx) => {
      const record = await tx.sale.findFirstOrThrow({
        where: { id: saleId, businessId },
        include: { items: true, payments: true, business: true }
      });

      if (record.status !== SaleStatus.pending_payment && record.status !== SaleStatus.completed) {
        throw conflictError("Only pending-payment sales can be completed.");
      }

      if (!record.reservationExpiresAt || record.reservationExpiresAt < new Date()) {
        await releaseExpiredReservations(tx, businessId);
        throw conflictError(
          "Cart reservation expired. Inventory was refreshed. Please review item availability before completing payment.",
          "RESERVATION_EXPIRED"
        );
      }

      for (const payment of values.payments) {
        await tx.payment.create({
          data: {
            saleId,
            method: payment.method,
            provider: payment.provider ?? "manual",
            amount: toDecimal(payment.amount),
            status: payment.amount > 0 ? PaymentStatus.settled : PaymentStatus.failed,
            externalReference: payment.externalReference || null
          }
        });
      }

      const refreshed = await tx.sale.findUniqueOrThrow({
        where: { id: saleId },
        include: { items: true, payments: true, business: true }
      });

      const amountPaid = sumSuccessfulPayments(
        refreshed.payments.map((payment) => ({
          amount: Number(payment.amount),
          status: payment.status
        }))
      );
      const amountDue = Math.max(roundMoney(Number(refreshed.totalAmount) - amountPaid), 0);

      if (amountDue > 0) {
        return tx.sale.update({
          where: { id: saleId },
          data: {
            amountPaid: toDecimal(amountPaid),
            amountDue: toDecimal(amountDue)
          },
          include: { items: true, payments: true }
        });
      }

      for (const item of refreshed.items) {
        await commitReservedInventory(tx, {
          productId: item.productId,
          locationId: refreshed.locationId,
          quantity: Number(item.quantity),
          referenceId: saleId,
          createdById: actorUserId
        });
      }

      const receiptNumber = await allocateReceiptNumber(tx, businessId);

      const completedAt = new Date();
      const { start } = getBusinessDayRange(refreshed.business.timezone, completedAt);

      const completedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          status: SaleStatus.completed,
          amountPaid: toDecimal(amountPaid),
          amountDue: toDecimal(0),
          completedAt,
          businessTimezoneDate: start,
          reservationExpiresAt: null,
          receiptNumber
        },
        include: { items: true, payments: true }
      });

      await createIdempotencyRecord(tx, businessId, "complete_sale", values.idempotencyKey, "sale", saleId);

      await logAudit({
        tx,
        businessId,
        actorUserId,
        action: "sale_completed",
        resourceType: "sale",
        resourceId: saleId,
        metadata: { receiptNumber: completedSale.receiptNumber }
      });

      return completedSale;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }
  );

  return sale;
}

export async function listSales(businessId: string, options?: { q?: string; page?: number; pageSize?: number }) {
  const query = options?.q?.trim();
  const where = {
    businessId,
    ...(query
      ? {
          receiptNumber: {
            contains: query,
            mode: "insensitive" as const
          }
        }
      : {})
  };

  if (typeof options?.page !== "number" && typeof options?.pageSize !== "number") {
    const items = await db.sale.findMany({
      where,
      include: {
        cashier: true,
        payments: true
      },
      orderBy: { createdAt: "desc" }
    });

    return {
      items,
      totalCount: items.length,
      totalPages: 1,
      currentPage: 1
    };
  }

  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.max(1, options?.pageSize ?? 20);
  const skip = (page - 1) * pageSize;

  const [items, totalCount] = await Promise.all([
    db.sale.findMany({
      where,
      include: {
        cashier: true,
        payments: true
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize
    }),
    db.sale.count({ where })
  ]);

  return {
    items,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page
  };
}

export async function listRefunds(businessId: string, options?: { page?: number; pageSize?: number }) {
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.max(1, options?.pageSize ?? 20);
  const skip = (page - 1) * pageSize;
  const where = { businessId };

  const [items, totalCount] = await Promise.all([
    db.refund.findMany({
      where,
      include: {
        sale: {
          select: {
            id: true,
            receiptNumber: true,
            totalAmount: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize
    }),
    db.refund.count({ where })
  ]);

  return {
    items,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page
  };
}

export async function listOnlineOrders(businessId: string, options?: { q?: string; status?: OrderStatus; page?: number; pageSize?: number }) {
  const query = options?.q?.trim();
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.max(1, options?.pageSize ?? 20);
  const skip = (page - 1) * pageSize;
  const where = {
    businessId,
    ...(options?.status
      ? {
          status: options.status
        }
      : {}),
    ...(query
      ? {
          OR: [
            {
              orderNumber: {
                contains: query,
                mode: "insensitive" as const
              }
            },
            {
              customer: {
                is: {
                  fullName: {
                    contains: query,
                    mode: "insensitive" as const
                  }
                }
              }
            }
          ]
        }
      : {})
  };

  const [items, totalCount] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true,
        fulfillment: true
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize
    }),
    db.order.count({ where })
  ]);

  return {
    items,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page
  };
}

export async function getSaleDetail(businessId: string, saleId: string) {
  return db.sale.findFirstOrThrow({
    where: { businessId, id: saleId },
    include: {
      business: true,
      location: true,
      cashier: true,
      items: {
        include: {
          product: true,
          refundItems: true
        }
      },
      payments: true,
      refunds: {
        include: {
          items: true,
          refundPayments: true
        }
      }
    }
  });
}

export async function createRefund(actorUserId: string, businessId: string, saleId: string, input: unknown) {
  const values = refundSchema.parse(input);
  const existing = await findIdempotentResult(businessId, "refund_payment", values.idempotencyKey);
  if (existing) {
    return db.refund.findUniqueOrThrow({
      where: { id: existing.resourceId },
      include: { items: true, refundPayments: true }
    });
  }

  const refund = await db.$transaction(
    async (tx) => {
      const sale = await tx.sale.findFirstOrThrow({
        where: { id: saleId, businessId },
        include: {
          items: {
            include: {
              refundItems: true
            }
          },
          payments: true
        }
      });
      if (sale.status !== SaleStatus.completed && sale.status !== SaleStatus.refunded_partially) {
        throw conflictError("Only completed or partially refunded sales can be refunded.");
      }

      let newRefundAmount = 0;
      for (const item of values.items) {
        const saleItem = sale.items.find((entry) => entry.id === item.saleItemId);
        if (!saleItem) {
          throw notFoundError("Refund item not found on sale.");
        }

        const alreadyRefundedQuantity = saleItem.refundItems.reduce((sum, refundItem) => sum + Number(refundItem.quantityRefunded), 0);
        const remainingQuantity = Number(saleItem.quantity) - alreadyRefundedQuantity;
        if (item.quantity > remainingQuantity) {
          throw validationError("Refund quantity exceeds remaining refundable quantity.", {
            fieldErrors: {
              items: ["Refund quantity exceeds remaining refundable quantity."]
            }
          });
        }

        const perUnitAmount = roundMoney(Number(saleItem.lineTotal) / Number(saleItem.quantity));
        const amountRefunded = roundMoney(perUnitAmount * item.quantity);
        newRefundAmount = roundMoney(newRefundAmount + amountRefunded);
      }

      const existingRefunds = await tx.refund.aggregate({
        where: {
          saleId: sale.id,
          status: { not: RefundStatus.cancelled }
        },
        _sum: {
          refundTotalAmount: true
        }
      });
      const previousRefundTotal = existingRefunds._sum.refundTotalAmount?.toNumber() ?? 0;
      const saleTotal = sale.totalAmount.toNumber();

      if (previousRefundTotal + newRefundAmount > saleTotal) {
        throw new Error(
          `Refund exceeds sale total. Sale total: $${saleTotal.toFixed(2)}, already refunded: $${previousRefundTotal.toFixed(2)}, requested: $${newRefundAmount.toFixed(2)}`
        );
      }

      const refundRecord = await tx.refund.create({
        data: {
          businessId,
          saleId,
          createdById: actorUserId,
          status: RefundStatus.pending,
          refundTotalAmount: toDecimal(0),
          reasonCode: values.reasonCode,
          note: values.note
        }
      });

      let refundTotalAmount = 0;
      let currentRequestRefundedQuantity = 0;
      for (const item of values.items) {
        const saleItem = sale.items.find((entry) => entry.id === item.saleItemId);
        if (!saleItem) {
          throw notFoundError("Refund item not found on sale.");
        }

        const alreadyRefundedQuantity = saleItem.refundItems.reduce((sum, refundItem) => sum + Number(refundItem.quantityRefunded), 0);
        const remainingQuantity = Number(saleItem.quantity) - alreadyRefundedQuantity;
        if (item.quantity > remainingQuantity) {
          throw validationError("Refund quantity exceeds remaining refundable quantity.", {
            fieldErrors: {
              items: ["Refund quantity exceeds remaining refundable quantity."]
            }
          });
        }

        const perUnitAmount = roundMoney(Number(saleItem.lineTotal) / Number(saleItem.quantity));
        const amountRefunded = roundMoney(perUnitAmount * item.quantity);
        refundTotalAmount = roundMoney(refundTotalAmount + amountRefunded);
        currentRequestRefundedQuantity += item.quantity;

        await tx.refundItem.create({
          data: {
            refundId: refundRecord.id,
            saleItemId: saleItem.id,
            quantityRefunded: toDecimal(item.quantity),
            amountRefunded: toDecimal(amountRefunded),
            restockAction: item.restockAction as RestockAction
          }
        });

        if (item.restockAction === "restock_to_sellable") {
          await restockInventory(tx, {
            productId: saleItem.productId,
            locationId: sale.locationId,
            quantity: item.quantity,
            referenceId: refundRecord.id,
            createdById: actorUserId,
            reason: values.reasonCode
          });
        } else {
          await tx.inventoryMovement.create({
            data: {
              productId: saleItem.productId,
              locationId: sale.locationId,
              movementType: InventoryMovementType.refund_no_restock,
              quantityDelta: toDecimal(0),
              referenceType: "refund",
              referenceId: refundRecord.id,
              reason: item.restockAction,
              createdById: actorUserId
            }
          });
        }
      }

      let remaining = refundTotalAmount;
      for (const payment of sale.payments) {
        if (remaining <= 0) break;

        const priorRefunded = await tx.refundPayment.aggregate({
          where: { paymentId: payment.id },
          _sum: { amountReversed: true }
        });
        const available = roundMoney(Number(payment.amount) - Number(priorRefunded._sum.amountReversed ?? 0));
        if (available <= 0) continue;
        const applied = Math.min(available, remaining);

        await tx.refundPayment.create({
          data: {
            refundId: refundRecord.id,
            paymentId: payment.id,
            amountReversed: toDecimal(applied)
          }
        });

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: applied === available ? PaymentStatus.refunded_full : PaymentStatus.refunded_partial
          }
        });
        remaining = roundMoney(remaining - applied);
      }
      if (remaining > 0) {
        throw conflictError("Refund amount exceeds the refundable payment balance.");
      }

      const alreadyRefundedQuantity = sale.items.reduce(
        (sum, item) => sum + item.refundItems.reduce((inner, refundItem) => inner + Number(refundItem.quantityRefunded), 0),
        0
      );
      const refundedQuantity = alreadyRefundedQuantity + currentRequestRefundedQuantity;
      const totalQuantity = sale.items.reduce((sum, item) => sum + Number(item.quantity), 0);

      await tx.refund.update({
        where: { id: refundRecord.id },
        data: {
          status: RefundStatus.completed,
          refundTotalAmount: toDecimal(refundTotalAmount)
        }
      });

      await tx.sale.update({
        where: { id: saleId },
        data: {
          status: refundedQuantity >= totalQuantity ? SaleStatus.refunded_fully : SaleStatus.refunded_partially
        }
      });

      await createIdempotencyRecord(tx, businessId, "refund_payment", values.idempotencyKey, "refund", refundRecord.id);

      await logAudit({
        tx,
        businessId,
        actorUserId,
        action: "refund_created",
        resourceType: "refund",
        resourceId: refundRecord.id,
        metadata: { saleId, refundTotalAmount }
      });

      return tx.refund.findUniqueOrThrow({
        where: { id: refundRecord.id },
        include: { items: true, refundPayments: true }
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }
  );

  return refund;
}

export async function getDashboardMetrics(businessId: string) {
  const business = await db.business.findUniqueOrThrow({ where: { id: businessId } });
  const { start, end } = getBusinessDayRange(business.timezone);

  const [sales, onlineOrders, balances, pendingPayments, topProducts, recentActivity, openPurchaseOrders, supplierProducts] = await Promise.all([
    db.sale.findMany({
      where: {
        businessId,
        completedAt: { gte: start, lte: end },
        status: { in: [SaleStatus.completed, SaleStatus.refunded_partially, SaleStatus.refunded_fully] }
      }
    }),
    db.order.findMany({
      where: {
        businessId,
        createdAt: { gte: start, lte: end },
        status: { not: "cancelled" }
      }
    }),
    db.inventoryBalance.findMany({
      where: {
        location: { businessId },
        product: { isArchived: false }
      },
      include: { product: true }
    }),
    db.sale.count({
      where: {
        businessId,
        status: SaleStatus.pending_payment
      }
    }),
    db.saleItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      where: {
        sale: {
          businessId,
          completedAt: { gte: start, lte: end },
          status: { in: [SaleStatus.completed, SaleStatus.refunded_partially, SaleStatus.refunded_fully] }
        }
      },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5
    }),
    db.auditLog.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    db.purchaseOrder.count({
      where: {
        businessId,
        status: { in: [PurchaseOrderStatus.draft, PurchaseOrderStatus.sent, PurchaseOrderStatus.accepted, PurchaseOrderStatus.ordered, PurchaseOrderStatus.partially_received] }
      }
    }),
    db.supplierProduct.count({
      where: {
        supplier: {
          businessId
        },
        isActive: true
      }
    })
  ]);

  const productIds = topProducts.map((entry) => entry.productId);
  const products = productIds.length
    ? await db.product.findMany({ where: { id: { in: productIds } } })
    : [];
  const productMap = new Map(products.map((product) => [product.id, product.name]));
  const lowStockItems = balances
    .filter((balance) => Number(balance.availableQuantity) < Number(balance.product.parLevel))
    .map((balance) => ({
      id: balance.productId,
      name: balance.product.name,
      availableQuantity: Number(balance.availableQuantity),
      parLevel: Number(balance.product.parLevel)
    }));

  return {
    salesToday: roundMoney(
      sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0) + onlineOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
    ),
    totalOrders: sales.length + onlineOrders.length,
    onlineOrdersToday: onlineOrders.length,
    lowStockAlerts: lowStockItems.length,
    pendingPayments,
    openPurchaseOrders,
    supplierCatalogCount: supplierProducts,
    topSellingProducts: topProducts.map((entry) => ({
      productId: entry.productId,
      name: productMap.get(entry.productId) ?? "Unknown",
      quantity: Number(entry._sum.quantity ?? 0)
    })),
    reorderList: lowStockItems.slice(0, 5),
    recentActivity
  };
}

export async function getReportsSnapshot(businessId: string) {
  const business = await db.business.findUniqueOrThrow({ where: { id: businessId } });
  const { start, end, parts } = getBusinessDayRange(business.timezone);
  const monthStart = zonedDateTimeToUtc(business.timezone, parts.year, parts.month, 1, 0, 0, 0);

  const [dailySales, monthlySales, dailyOrders, monthlyOrders, paymentBreakdown, orderPaymentBreakdown, openPurchaseOrders] = await Promise.all([
    db.sale.findMany({
      where: {
        businessId,
        completedAt: { gte: start, lte: end },
        status: { in: [SaleStatus.completed, SaleStatus.refunded_partially, SaleStatus.refunded_fully] }
      }
    }),
    db.sale.findMany({
      where: {
        businessId,
        completedAt: { gte: monthStart },
        status: { in: [SaleStatus.completed, SaleStatus.refunded_partially, SaleStatus.refunded_fully] }
      }
    }),
    db.order.findMany({
      where: {
        businessId,
        createdAt: { gte: start, lte: end },
        status: { not: "cancelled" }
      }
    }),
    db.order.findMany({
      where: {
        businessId,
        createdAt: { gte: monthStart },
        status: { not: "cancelled" }
      }
    }),
    db.payment.groupBy({
      by: ["method"],
      _sum: { amount: true },
      where: {
        sale: { businessId },
        status: {
          in: [PaymentStatus.authorized, PaymentStatus.captured, PaymentStatus.settled, PaymentStatus.refunded_partial, PaymentStatus.refunded_full]
        }
      }
    }),
    db.orderPayment.groupBy({
      by: ["method"],
      _sum: { amount: true },
      where: {
        order: { businessId },
        status: {
          in: [PaymentStatus.authorized, PaymentStatus.captured, PaymentStatus.settled, PaymentStatus.refunded_partial, PaymentStatus.refunded_full]
        }
      }
    }),
    db.purchaseOrder.count({
      where: {
        businessId,
        status: { in: [PurchaseOrderStatus.draft, PurchaseOrderStatus.sent, PurchaseOrderStatus.accepted, PurchaseOrderStatus.ordered, PurchaseOrderStatus.partially_received] }
      }
    })
  ]);

  const paymentTotals = new Map<string, number>();
  for (const entry of paymentBreakdown) {
    paymentTotals.set(entry.method, Number(entry._sum.amount ?? 0));
  }
  for (const entry of orderPaymentBreakdown) {
    paymentTotals.set(entry.method, Number(entry._sum.amount ?? 0) + (paymentTotals.get(entry.method) ?? 0));
  }

  return {
    dailyRevenue: roundMoney(
      dailySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0) + dailyOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
    ),
    monthlyRevenue: roundMoney(
      monthlySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0) + monthlyOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
    ),
    transactionCount: monthlySales.length + monthlyOrders.length,
    onlineOrderCount: monthlyOrders.length,
    openPurchaseOrders,
    paymentBreakdown: [...paymentTotals.entries()].map(([method, amount]) => ({
      method,
      amount
    })),
    generatedAt: formatBusinessDateStamp(business.timezone)
  };
}
