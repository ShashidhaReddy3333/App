"use client";

import dynamic from "next/dynamic";

type ReportsChartProps = {
  data: Array<{ method: string; amount: number }>;
};

type WeeklyRevenueLineChartProps = {
  data: Array<{ date: string; revenue: number }>;
};

const ReportsChartDynamic = dynamic(
  () =>
    import("@/components/reports-chart").then((mod) => ({
      default: mod.ReportsChart
    })),
  {
    loading: () => <div className="h-[300px] w-full rounded-lg bg-secondary animate-pulse" />,
    ssr: false
  }
);

const WeeklyRevenueLineChartDynamic = dynamic(
  () =>
    import("@/components/retailer-analytics-charts").then((mod) => ({
      default: mod.WeeklyRevenueLineChart
    })),
  {
    loading: () => <div className="h-[300px] w-full rounded-lg bg-secondary animate-pulse" />,
    ssr: false
  }
);

export function ReportsChart(props: ReportsChartProps) {
  return <ReportsChartDynamic {...props} />;
}

export function WeeklyRevenueLineChart(props: WeeklyRevenueLineChartProps) {
  return <WeeklyRevenueLineChartDynamic {...props} />;
}
