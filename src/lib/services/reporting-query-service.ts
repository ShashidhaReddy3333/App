import { OrderStatus, SaleStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { roundMoney } from "@/lib/money";
import { getBusinessDayRange, zonedDateTimeToUtc } from "@/lib/timezone";

export { getDashboardMetrics, getReportsSnapshot } from "@/lib/services/sales-service";

type DateParts = {
  year: number;
  month: number;
  day: number;
};

type RevenuePoint = {
  date: string;
  revenue: number;
};

type TopCustomerPoint = {
  name: string;
  total: number;
};

type OrderVolumePoint = {
  date: string;
  count: number;
};

type CategoryInventoryPoint = {
  category: string;
  value: number;
};

type StockTurnoverPoint = {
  category: string;
  soldQuantity: number;
  averageInventory: number;
  turnoverRate: number;
};

export type EnhancedDashboardMetrics = {
  dailyRevenue: RevenuePoint[];
  weeklyRevenue: RevenuePoint[];
  topCustomers: TopCustomerPoint[];
  orderVolumeDaily: OrderVolumePoint[];
  totalInventoryValue: number;
  stockTurnoverByCategory: StockTurnoverPoint[];
  categoryInventory: CategoryInventoryPoint[];
  lowStockCount: number;
  outOfStockCount: number;
  revenueComparison: {
    thisMonth: number;
    lastMonth: number;
    growthPercentage: number;
  };
};

function toDateKey(parts: DateParts) {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function fromDateKey(key: string): DateParts {
  const [year = 1970, month = 1, day = 1] = key.split("-").map(Number);
  return { year, month, day };
}

function shiftDateParts(parts: DateParts, dayDelta: number): DateParts {
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + dayDelta));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function shiftMonth(year: number, month: number, monthDelta: number) {
  const shifted = new Date(Date.UTC(year, month - 1 + monthDelta, 1));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
  };
}

function toZonedDateParts(date: Date, timeZone: string): DateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  ) as Record<string, number>;

  return {
    year: parts.year ?? date.getUTCFullYear(),
    month: parts.month ?? date.getUTCMonth() + 1,
    day: parts.day ?? date.getUTCDate(),
  };
}

function getWeekStartParts(parts: DateParts, weekStartsOn: number) {
  const normalizedWeekStart = ((weekStartsOn % 7) + 7) % 7;
  const dayOfWeek = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  const daysBack = (dayOfWeek - normalizedWeekStart + 7) % 7;
  return shiftDateParts(parts, -daysBack);
}

function toGrowthPercentage(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function toFixedQuantity(value: number) {
  return Number(value.toFixed(3));
}

export async function getEnhancedDashboardMetrics(
  businessId: string,
  locationId?: string
): Promise<EnhancedDashboardMetrics> {
  const business = await db.business.findUniqueOrThrow({
    where: { id: businessId },
    select: {
      timezone: true,
      weekStartsOn: true,
    },
  });

  const { parts: today } = getBusinessDayRange(business.timezone);

  const dailyDateKeys: string[] = [];
  for (let offset = 29; offset >= 0; offset -= 1) {
    dailyDateKeys.push(toDateKey(shiftDateParts(today, -offset)));
  }

  const currentWeekStart = getWeekStartParts(today, business.weekStartsOn);
  const weeklyDateKeys: string[] = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    weeklyDateKeys.push(toDateKey(shiftDateParts(currentWeekStart, -(offset * 7))));
  }

  const lastThirtyStartParts = fromDateKey(dailyDateKeys[0] ?? toDateKey(today));
  const twelveWeekStartParts = fromDateKey(weeklyDateKeys[0] ?? toDateKey(currentWeekStart));
  const tomorrowParts = shiftDateParts(today, 1);

  const thisMonthStart = zonedDateTimeToUtc(business.timezone, today.year, today.month, 1, 0, 0, 0);
  const previousMonth = shiftMonth(today.year, today.month, -1);
  const lastMonthStart = zonedDateTimeToUtc(
    business.timezone,
    previousMonth.year,
    previousMonth.month,
    1,
    0,
    0,
    0
  );

  const lastThirtyStart = zonedDateTimeToUtc(
    business.timezone,
    lastThirtyStartParts.year,
    lastThirtyStartParts.month,
    lastThirtyStartParts.day,
    0,
    0,
    0
  );
  const twelveWeekStart = zonedDateTimeToUtc(
    business.timezone,
    twelveWeekStartParts.year,
    twelveWeekStartParts.month,
    twelveWeekStartParts.day,
    0,
    0,
    0
  );
  const tomorrowStart = zonedDateTimeToUtc(
    business.timezone,
    tomorrowParts.year,
    tomorrowParts.month,
    tomorrowParts.day,
    0,
    0,
    0
  );

  const analyticsSalesStart = new Date(
    Math.min(lastMonthStart.getTime(), twelveWeekStart.getTime())
  );

  const [
    completedSales,
    ordersLastThirtyDays,
    topCustomerSpend,
    inventoryBalances,
    saleItemsLastThirtyDays,
  ] = await Promise.all([
    db.sale.findMany({
      where: {
        businessId,
        ...(locationId ? { locationId } : {}),
        status: SaleStatus.completed,
        createdAt: {
          gte: analyticsSalesStart,
          lt: tomorrowStart,
        },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    }),
    db.order.findMany({
      where: {
        businessId,
        ...(locationId ? { locationId } : {}),
        createdAt: {
          gte: lastThirtyStart,
          lt: tomorrowStart,
        },
      },
      select: {
        createdAt: true,
      },
    }),
    db.order.groupBy({
      by: ["customerId"],
      where: {
        businessId,
        ...(locationId ? { locationId } : {}),
        customerId: { not: null },
        status: { not: OrderStatus.cancelled },
      },
      _sum: {
        totalAmount: true,
      },
      orderBy: {
        _sum: {
          totalAmount: "desc",
        },
      },
      take: 5,
    }),
    db.inventoryBalance.findMany({
      where: {
        location: { businessId },
        ...(locationId ? { locationId } : {}),
        product: {
          businessId,
          isArchived: false,
        },
      },
      select: {
        onHandQuantity: true,
        availableQuantity: true,
        product: {
          select: {
            category: true,
            purchasePrice: true,
            parLevel: true,
          },
        },
      },
    }),
    db.saleItem.findMany({
      where: {
        sale: {
          businessId,
          ...(locationId ? { locationId } : {}),
          status: SaleStatus.completed,
          createdAt: {
            gte: lastThirtyStart,
            lt: tomorrowStart,
          },
        },
      },
      select: {
        quantity: true,
        product: {
          select: {
            category: true,
          },
        },
      },
    }),
  ]);

  const customerIds = topCustomerSpend.flatMap((entry) =>
    entry.customerId ? [entry.customerId] : []
  );
  const topUsers = customerIds.length
    ? await db.user.findMany({
        where: {
          id: {
            in: customerIds,
          },
        },
        select: {
          id: true,
          fullName: true,
        },
      })
    : [];

  const userMap = new Map(topUsers.map((user) => [user.id, user.fullName]));

  const dailyRevenueMap = new Map<string, number>();
  const weeklyRevenueMap = new Map<string, number>();

  let thisMonthRevenue = 0;
  let lastMonthRevenue = 0;

  for (const sale of completedSales) {
    const amount = Number(sale.totalAmount);
    const localDate = toZonedDateParts(sale.createdAt, business.timezone);
    const dateKey = toDateKey(localDate);
    const weekKey = toDateKey(getWeekStartParts(localDate, business.weekStartsOn));

    if (dailyRevenueMap.has(dateKey)) {
      dailyRevenueMap.set(dateKey, dailyRevenueMap.get(dateKey)! + amount);
    } else {
      dailyRevenueMap.set(dateKey, amount);
    }

    if (weeklyRevenueMap.has(weekKey)) {
      weeklyRevenueMap.set(weekKey, weeklyRevenueMap.get(weekKey)! + amount);
    } else {
      weeklyRevenueMap.set(weekKey, amount);
    }

    if (sale.createdAt >= thisMonthStart) {
      thisMonthRevenue += amount;
    } else if (sale.createdAt >= lastMonthStart && sale.createdAt < thisMonthStart) {
      lastMonthRevenue += amount;
    }
  }

  const orderCountMap = new Map<string, number>();
  for (const order of ordersLastThirtyDays) {
    const dateKey = toDateKey(toZonedDateParts(order.createdAt, business.timezone));
    orderCountMap.set(dateKey, (orderCountMap.get(dateKey) ?? 0) + 1);
  }

  let totalInventoryValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  const categoryInventoryValueMap = new Map<string, number>();
  const categoryOnHandTotals = new Map<string, number>();
  const categoryOnHandCounts = new Map<string, number>();
  const categorySoldQuantityMap = new Map<string, number>();

  for (const balance of inventoryBalances) {
    const category = balance.product.category || "Uncategorized";
    const onHand = Number(balance.onHandQuantity);
    const available = Number(balance.availableQuantity);
    const parLevel = Number(balance.product.parLevel);
    const value = onHand * Number(balance.product.purchasePrice);

    totalInventoryValue += value;
    categoryInventoryValueMap.set(category, (categoryInventoryValueMap.get(category) ?? 0) + value);
    categoryOnHandTotals.set(category, (categoryOnHandTotals.get(category) ?? 0) + onHand);
    categoryOnHandCounts.set(category, (categoryOnHandCounts.get(category) ?? 0) + 1);

    if (available <= 0) {
      outOfStockCount += 1;
    } else if (available < parLevel) {
      lowStockCount += 1;
    }
  }

  for (const saleItem of saleItemsLastThirtyDays) {
    const category = saleItem.product.category || "Uncategorized";
    categorySoldQuantityMap.set(
      category,
      (categorySoldQuantityMap.get(category) ?? 0) + Number(saleItem.quantity)
    );
  }

  const allCategories = new Set<string>([
    ...categoryOnHandTotals.keys(),
    ...categorySoldQuantityMap.keys(),
  ]);

  const stockTurnoverByCategory = [...allCategories]
    .map((category) => {
      const soldQuantity = categorySoldQuantityMap.get(category) ?? 0;
      const onHandTotal = categoryOnHandTotals.get(category) ?? 0;
      const balanceCount = categoryOnHandCounts.get(category) ?? 0;
      const averageInventory = balanceCount > 0 ? onHandTotal / balanceCount : 0;
      const turnoverRate = averageInventory > 0 ? soldQuantity / averageInventory : 0;

      return {
        category,
        soldQuantity: toFixedQuantity(soldQuantity),
        averageInventory: toFixedQuantity(averageInventory),
        turnoverRate: toFixedQuantity(turnoverRate),
      };
    })
    .sort(
      (left, right) =>
        right.soldQuantity - left.soldQuantity || left.category.localeCompare(right.category)
    );

  return {
    dailyRevenue: dailyDateKeys.map((date) => ({
      date,
      revenue: roundMoney(dailyRevenueMap.get(date) ?? 0),
    })),
    weeklyRevenue: weeklyDateKeys.map((date) => ({
      date,
      revenue: roundMoney(weeklyRevenueMap.get(date) ?? 0),
    })),
    topCustomers: topCustomerSpend.map((entry) => ({
      name: userMap.get(entry.customerId ?? "") ?? "Unknown customer",
      total: roundMoney(Number(entry._sum.totalAmount ?? 0)),
    })),
    orderVolumeDaily: dailyDateKeys.map((date) => ({
      date,
      count: orderCountMap.get(date) ?? 0,
    })),
    totalInventoryValue: roundMoney(totalInventoryValue),
    stockTurnoverByCategory,
    categoryInventory: [...categoryInventoryValueMap.entries()]
      .map(([category, value]) => ({
        category,
        value: roundMoney(value),
      }))
      .sort((left, right) => right.value - left.value),
    lowStockCount,
    outOfStockCount,
    revenueComparison: {
      thisMonth: roundMoney(thisMonthRevenue),
      lastMonth: roundMoney(lastMonthRevenue),
      growthPercentage: toGrowthPercentage(thisMonthRevenue, lastMonthRevenue),
    },
  };
}
