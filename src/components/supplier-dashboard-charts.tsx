"use client";

import dynamic from "next/dynamic";

type SupplierRevenueChartProps = {
  data: Array<{ month: string; revenue: number }>;
};

type SupplierTopProductsChartProps = {
  data: Array<{ name: string; quantity: number }>;
};

const SupplierRevenueChartDynamic = dynamic(
  () =>
    import("@/components/supplier-analytics-charts").then((mod) => ({
      default: mod.SupplierRevenueChart
    })),
  {
    loading: () => <div className="h-[300px] w-full rounded-lg bg-secondary animate-pulse" />,
    ssr: false
  }
);

const SupplierTopProductsChartDynamic = dynamic(
  () =>
    import("@/components/supplier-analytics-charts").then((mod) => ({
      default: mod.SupplierTopProductsChart
    })),
  {
    loading: () => <div className="h-[300px] w-full rounded-lg bg-secondary animate-pulse" />,
    ssr: false
  }
);

export function SupplierRevenueChart(props: SupplierRevenueChartProps) {
  return <SupplierRevenueChartDynamic {...props} />;
}

export function SupplierTopProductsChart(props: SupplierTopProductsChartProps) {
  return <SupplierTopProductsChartDynamic {...props} />;
}
