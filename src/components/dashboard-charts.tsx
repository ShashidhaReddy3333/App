"use client";

import dynamic from "next/dynamic";

type RevenueTrendChartProps = {
  data: Array<{ date: string; revenue: number }>;
};

type OrderVolumeChartProps = {
  data: Array<{ date: string; count: number }>;
};

type TopCustomersChartProps = {
  data: Array<{ name: string; total: number }>;
};

type CategoryInventoryChartProps = {
  data: Array<{ category: string; value: number }>;
};

const RevenueTrendChartDynamic = dynamic(
  () =>
    import("@/components/retailer-analytics-charts").then((mod) => ({
      default: mod.RevenueTrendChart
    })),
  {
    loading: () => <div className="h-[300px] w-full rounded-lg bg-secondary animate-pulse" />,
    ssr: false
  }
);

const OrderVolumeChartDynamic = dynamic(
  () =>
    import("@/components/retailer-analytics-charts").then((mod) => ({
      default: mod.OrderVolumeChart
    })),
  {
    loading: () => <div className="h-[300px] w-full rounded-lg bg-secondary animate-pulse" />,
    ssr: false
  }
);

const TopCustomersChartDynamic = dynamic(
  () =>
    import("@/components/retailer-analytics-charts").then((mod) => ({
      default: mod.TopCustomersChart
    })),
  {
    loading: () => <div className="h-[300px] w-full rounded-lg bg-secondary animate-pulse" />,
    ssr: false
  }
);

const CategoryInventoryChartDynamic = dynamic(
  () =>
    import("@/components/retailer-analytics-charts").then((mod) => ({
      default: mod.CategoryInventoryChart
    })),
  {
    loading: () => <div className="h-[300px] w-full rounded-lg bg-secondary animate-pulse" />,
    ssr: false
  }
);

export function RevenueTrendChart(props: RevenueTrendChartProps) {
  return <RevenueTrendChartDynamic {...props} />;
}

export function OrderVolumeChart(props: OrderVolumeChartProps) {
  return <OrderVolumeChartDynamic {...props} />;
}

export function TopCustomersChart(props: TopCustomersChartProps) {
  return <TopCustomersChartDynamic {...props} />;
}

export function CategoryInventoryChart(props: CategoryInventoryChartProps) {
  return <CategoryInventoryChartDynamic {...props} />;
}
