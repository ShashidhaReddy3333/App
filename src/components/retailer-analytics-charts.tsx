"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #E5E5E5",
  borderRadius: "0.5rem",
  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.08)"
};

const pieColors = ["#06C167", "#000000", "#262626", "#525252", "#737373", "#A3A3A3"];

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateLabel(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export function RevenueTrendChart({ data }: { data: Array<{ date: string; revenue: number }> }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid stroke="#E5E5E5" vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDateLabel} minTickGap={24} />
          <YAxis tickFormatter={(value: number) => `$${value.toLocaleString("en-CA")}`} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(value) => formatDateLabel(String(value))}
            formatter={(value) => formatCurrency(Number(value))}
          />
          <Area type="monotone" dataKey="revenue" stroke="#06C167" fill="#06C167" fillOpacity={0.1} strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrderVolumeChart({ data }: { data: Array<{ date: string; count: number }> }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid stroke="#E5E5E5" vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDateLabel} minTickGap={24} />
          <YAxis allowDecimals={false} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(value) => formatDateLabel(String(value))}
            formatter={(value) => [Number(value), "Orders"]}
          />
          <Bar dataKey="count" fill="#000000" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopCustomersChart({ data }: { data: Array<{ name: string; total: number }> }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 12, right: 12 }}>
          <CartesianGrid stroke="#E5E5E5" horizontal={false} />
          <XAxis type="number" tickFormatter={(value: number) => `$${value.toLocaleString("en-CA")}`} />
          <YAxis dataKey="name" type="category" width={128} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(Number(value))} />
          <Bar dataKey="total" fill="#000000" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryInventoryChart({ data }: { data: Array<{ category: string; value: number }> }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(Number(value))} />
          <Legend verticalAlign="bottom" height={24} />
          <Pie data={data} dataKey="value" nameKey="category" innerRadius={60} outerRadius={95} paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={entry.category} fill={pieColors[index % pieColors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeeklyRevenueLineChart({ data }: { data: Array<{ date: string; revenue: number }> }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid stroke="#E5E5E5" vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDateLabel} minTickGap={24} />
          <YAxis tickFormatter={(value: number) => `$${value.toLocaleString("en-CA")}`} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(value) => formatDateLabel(String(value))}
            formatter={(value) => formatCurrency(Number(value))}
          />
          <Line type="monotone" dataKey="revenue" stroke="#06C167" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
