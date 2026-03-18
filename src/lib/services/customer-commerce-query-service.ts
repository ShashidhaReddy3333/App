import { OrderStatus } from "@prisma/client";

import { db } from "@/lib/db";

export type CustomerAnalytics = {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  statusBreakdown: Array<{ status: string; count: number }>;
  ordersPerDay: Array<{ date: string; count: number }>;
  topProducts: Array<{
    productId: string;
    name: string;
    timesOrdered: number;
    totalQuantity: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: Date;
  }>;
};

function toUtcDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

export async function getCustomerAnalytics(customerId: string): Promise<CustomerAnalytics> {
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);

  const thirtyDaysAgoUtc = new Date(todayUtc);
  thirtyDaysAgoUtc.setUTCDate(thirtyDaysAgoUtc.getUTCDate() - 29);

  const [
    totalOrders,
    completedOrderAggregate,
    statusBreakdownRaw,
    orderActivityRaw,
    topProductsRaw,
    recentOrdersRaw
  ] = await db.$transaction([
    db.order.count({
      where: { customerId }
    }),
    db.order.aggregate({
      where: {
        customerId,
        status: OrderStatus.completed
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    }),
    db.order.groupBy({
      by: ["status"],
      where: { customerId },
      _count: {
        _all: true
      },
      orderBy: {
        status: "asc"
      }
    }),
    db.order.findMany({
      where: {
        customerId,
        createdAt: {
          gte: thirtyDaysAgoUtc
        }
      },
      select: {
        createdAt: true
      }
    }),
    db.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          customerId,
          status: OrderStatus.completed
        }
      },
      _sum: {
        quantity: true
      },
      _count: {
        orderId: true
      },
      orderBy: {
        _sum: {
          quantity: "desc"
        }
      },
      take: 5
    }),
    db.order.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true
      }
    })
  ]);

  const totalSpent = Number(completedOrderAggregate._sum.totalAmount ?? 0);
  const completedOrdersCount = completedOrderAggregate._count.id;
  const averageOrderValue = completedOrdersCount > 0 ? totalSpent / completedOrdersCount : 0;

  const statusBreakdown = statusBreakdownRaw.map((group) => {
    const count =
      typeof group._count === "object" &&
      group._count !== null &&
      "_all" in group._count
        ? Number(group._count._all ?? 0)
        : 0;

    return {
      status: group.status,
      count
    };
  });

  const ordersByDate = new Map<string, number>();
  for (const order of orderActivityRaw) {
    const orderDate = new Date(order.createdAt);
    orderDate.setUTCHours(0, 0, 0, 0);
    const key = toUtcDateKey(orderDate);
    ordersByDate.set(key, (ordersByDate.get(key) ?? 0) + 1);
  }

  const ordersPerDay = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(thirtyDaysAgoUtc);
    date.setUTCDate(thirtyDaysAgoUtc.getUTCDate() + index);
    const key = toUtcDateKey(date);
    return {
      date: key,
      count: ordersByDate.get(key) ?? 0
    };
  });

  const productIds = topProductsRaw.map((item) => item.productId);
  const products = productIds.length
    ? await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    })
    : [];
  const productNameById = new Map(products.map((product) => [product.id, product.name]));

  const topProducts = topProductsRaw.map((item) => {
    const timesOrdered =
      typeof item._count === "object" &&
      item._count !== null &&
      "orderId" in item._count
        ? Number(item._count.orderId ?? 0)
        : 0;
    const totalQuantity =
      typeof item._sum === "object" &&
      item._sum !== null &&
      "quantity" in item._sum
        ? Number(item._sum.quantity ?? 0)
        : 0;

    return {
      productId: item.productId,
      name: productNameById.get(item.productId) ?? "Unknown product",
      timesOrdered,
      totalQuantity
    };
  });

  const recentOrders = recentOrdersRaw.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt
  }));

  return {
    totalOrders,
    totalSpent,
    averageOrderValue,
    statusBreakdown,
    ordersPerDay,
    topProducts,
    recentOrders
  };
}

export { getCustomerCart, getCustomerOrderDetail, getStorefrontData, getStorefrontProduct, listCustomerOrders } from "@/lib/services/customer-commerce-service";
