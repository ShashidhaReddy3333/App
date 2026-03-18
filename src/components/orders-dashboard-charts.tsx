"use client";

import dynamic from "next/dynamic";
import type { OrderActivityDatum, OrderStatusDatum } from "@/components/customer-analytics-charts";

type OrderActivityChartProps = {
  data: OrderActivityDatum[];
};

type OrderStatusChartProps = {
  data: OrderStatusDatum[];
};

const OrderActivityChartDynamic = dynamic(
  () =>
    import("@/components/customer-analytics-charts").then((mod) => ({
      default: mod.OrderActivityChart
    })),
  {
    loading: () => <div className="h-[300px] w-full rounded-lg bg-secondary animate-pulse" />,
    ssr: false
  }
);

const OrderStatusChartDynamic = dynamic(
  () =>
    import("@/components/customer-analytics-charts").then((mod) => ({
      default: mod.OrderStatusChart
    })),
  {
    loading: () => <div className="h-[300px] w-full rounded-lg bg-secondary animate-pulse" />,
    ssr: false
  }
);

export function OrderActivityChart(props: OrderActivityChartProps) {
  return <OrderActivityChartDynamic {...props} />;
}

export function OrderStatusChart(props: OrderStatusChartProps) {
  return <OrderStatusChartDynamic {...props} />;
}
