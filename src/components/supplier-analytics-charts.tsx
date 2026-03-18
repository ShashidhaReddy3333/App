"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type SupplierRevenueChartProps = {
  data: Array<{ month: string; revenue: number }>;
};

type SupplierTopProductsChartProps = {
  data: Array<{ name: string; quantity: number }>;
};

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #E5E5E5",
  borderRadius: "8px",
  boxShadow: "0 6px 16px rgba(0, 0, 0, 0.12)"
} as const;

export function SupplierRevenueChart({ data }: SupplierRevenueChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${Number(value).toLocaleString()}`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => `$${Number(value).toLocaleString()}`} />
          <Bar dataKey="revenue" fill="#000000" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SupplierTopProductsChart({ data }: SupplierTopProductsChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 12, right: 12 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E5E5" />
          <XAxis type="number" tickLine={false} axisLine={false} />
          <YAxis dataKey="name" type="category" width={140} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => Number(value).toLocaleString()} />
          <Bar dataKey="quantity" fill="#000000" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
