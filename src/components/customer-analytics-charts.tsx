"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export type OrderActivityDatum = {
  date: string;
  count: number;
};

export type OrderStatusDatum = {
  status: string;
  count: number;
};

function formatDateLabel(value: string) {
  const parsedDate = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(parsedDate);
}

function formatStatusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function getStatusColor(status: string) {
  if (status === "completed") return "#06C167";
  if (status.includes("pending")) return "#000000";
  if (status === "cancelled") return "#4B5563";
  return "#D1D5DB";
}

export function OrderActivityChart({ data }: { data: OrderActivityDatum[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateLabel}
            tick={{ fill: "#6B7280", fontSize: 12 }}
            minTickGap={20}
          />
          <YAxis allowDecimals={false} tick={{ fill: "#6B7280", fontSize: 12 }} />
          <Tooltip
            labelFormatter={(value) => formatDateLabel(String(value))}
            cursor={{ fill: "rgba(0, 0, 0, 0.03)" }}
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #E5E5E5",
              borderRadius: "8px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.08)"
            }}
          />
          <Bar dataKey="count" fill="#000000" activeBar={{ fill: "#06C167" }} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrderStatusChart({ data }: { data: OrderStatusDatum[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            innerRadius={68}
            outerRadius={95}
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.status} fill={getStatusColor(entry.status)} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [value, formatStatusLabel(String(name))]}
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #E5E5E5",
              borderRadius: "8px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.08)"
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {data.map((entry) => (
          <div key={entry.status} className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: getStatusColor(entry.status) }} />
            <span className="capitalize">{formatStatusLabel(entry.status)}</span>
            <span className="ml-auto font-semibold text-foreground">{entry.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
