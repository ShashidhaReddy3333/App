import { PurchaseOrderStatus } from "@prisma/client";

import { db } from "@/lib/db";

export { listProcurementData, listSupplierPortalData } from "@/lib/services/procurement-service";

const COMPLETED_ORDER_STATUSES: PurchaseOrderStatus[] = [PurchaseOrderStatus.received, PurchaseOrderStatus.closed];
const OPEN_ORDER_STATUSES: PurchaseOrderStatus[] = [
  PurchaseOrderStatus.ordered,
  PurchaseOrderStatus.sent,
  PurchaseOrderStatus.accepted,
  PurchaseOrderStatus.partially_received
];
const EXCLUDED_FULFILLMENT_STATUSES: PurchaseOrderStatus[] = [PurchaseOrderStatus.draft, PurchaseOrderStatus.cancelled];

export type SupplierAnalytics = {
  totalRevenue: number;
  openOrders: number;
  completedOrders: number;
  averageFulfillmentDays: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  topProducts: Array<{ name: string; quantity: number }>;
  activeRetailers: number;
  fulfillmentRate: number;
};

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function getSupplierAnalytics(supplierId: string): Promise<SupplierAnalytics> {
  const now = new Date();
  const monthAnchors = Array.from({ length: 6 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - 5 + index, 1));
  const monthlyRevenueStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    completedRevenueAggregate,
    openOrders,
    completedOrders,
    fulfillmentEligibleOrders,
    uniqueBusinessIds,
    monthlyRevenueOrders,
    topProductGroups,
    completedOrderDates
  ] = await Promise.all([
    db.purchaseOrder.aggregate({
      where: {
        supplierId,
        status: { in: COMPLETED_ORDER_STATUSES }
      },
      _sum: { totalCost: true }
    }),
    db.purchaseOrder.count({
      where: {
        supplierId,
        status: { in: OPEN_ORDER_STATUSES }
      }
    }),
    db.purchaseOrder.count({
      where: {
        supplierId,
        status: { in: COMPLETED_ORDER_STATUSES }
      }
    }),
    db.purchaseOrder.count({
      where: {
        supplierId,
        status: { notIn: EXCLUDED_FULFILLMENT_STATUSES }
      }
    }),
    db.purchaseOrder.findMany({
      where: {
        supplierId,
        status: { notIn: EXCLUDED_FULFILLMENT_STATUSES }
      },
      select: { businessId: true },
      distinct: ["businessId"]
    }),
    db.purchaseOrder.findMany({
      where: {
        supplierId,
        status: { in: COMPLETED_ORDER_STATUSES },
        createdAt: { gte: monthlyRevenueStart }
      },
      select: {
        createdAt: true,
        totalCost: true
      }
    }),
    db.purchaseOrderItem.groupBy({
      by: ["productId"],
      where: {
        purchaseOrder: {
          supplierId,
          status: { notIn: EXCLUDED_FULFILLMENT_STATUSES }
        }
      },
      _sum: { orderedQuantity: true },
      orderBy: {
        _sum: { orderedQuantity: "desc" }
      },
      take: 5
    }),
    db.purchaseOrder.findMany({
      where: {
        supplierId,
        status: { in: COMPLETED_ORDER_STATUSES }
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true
      }
    })
  ]);

  const completedOrderIds = completedOrderDates.map((order) => order.id);
  const receiptLogs =
    completedOrderIds.length > 0
      ? await db.auditLog.findMany({
          where: {
            action: "purchase_order_received",
            resourceType: "purchase_order",
            resourceId: { in: completedOrderIds }
          },
          select: {
            resourceId: true,
            createdAt: true
          },
          orderBy: { createdAt: "asc" }
        })
      : [];

  const receiptByOrderId = new Map<string, Date>();
  for (const log of receiptLogs) {
    if (!receiptByOrderId.has(log.resourceId)) {
      receiptByOrderId.set(log.resourceId, log.createdAt);
    }
  }

  const fulfillmentDurations = completedOrderDates.map((order) => {
    const receivedAt = receiptByOrderId.get(order.id) ?? order.updatedAt;
    return Math.max((receivedAt.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24), 0);
  });

  const averageFulfillmentDays =
    fulfillmentDurations.length > 0
      ? fulfillmentDurations.reduce((sum, value) => sum + value, 0) / fulfillmentDurations.length
      : 0;

  const monthlyRevenueByKey = new Map<string, number>(monthAnchors.map((month) => [getMonthKey(month), 0]));
  for (const order of monthlyRevenueOrders) {
    const monthKey = getMonthKey(order.createdAt);
    const current = monthlyRevenueByKey.get(monthKey) ?? 0;
    monthlyRevenueByKey.set(monthKey, current + Number(order.totalCost));
  }

  const monthlyRevenue = monthAnchors.map((month) => ({
    month: month.toLocaleString("en-CA", { month: "short" }),
    revenue: monthlyRevenueByKey.get(getMonthKey(month)) ?? 0
  }));

  const productIds = topProductGroups.map((group) => group.productId);
  const products =
    productIds.length > 0
      ? await db.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true }
        })
      : [];
  const productNameById = new Map(products.map((product) => [product.id, product.name]));

  const topProducts = topProductGroups.map((group) => ({
    name: productNameById.get(group.productId) ?? "Unknown product",
    quantity: Number(group._sum.orderedQuantity ?? 0)
  }));

  return {
    totalRevenue: Number(completedRevenueAggregate._sum.totalCost ?? 0),
    openOrders,
    completedOrders,
    averageFulfillmentDays,
    monthlyRevenue,
    topProducts,
    activeRetailers: uniqueBusinessIds.length,
    fulfillmentRate: fulfillmentEligibleOrders > 0 ? (completedOrders / fulfillmentEligibleOrders) * 100 : 0
  };
}
