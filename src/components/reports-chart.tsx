"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ReportsChart({ data }: { data: Array<{ method: string; amount: number }> }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
          <XAxis dataKey="method" />
          <YAxis />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #E5E5E5",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Bar dataKey="amount" fill="#000000" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
