"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatTnd } from "@/lib/format";
import type { AdminStats } from "@/lib/types";

export function ActivityChart({ series }: { series: AdminStats["series"] }) {
  const rows = series.map((point) => ({
    label: point.date.slice(8),
    date: point.date,
    volume: Number(point.volume),
    transactions: point.transactions,
  }));

  return (
    <div className="h-60 w-full" role="img" aria-label="Money moved per day over the last 14 days">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--rule)" strokeDasharray="3 5" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--rule)" }}
          />
          <YAxis
            tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : String(value))}
          />
          <Tooltip
            cursor={{ fill: "var(--paper-2)", opacity: 0.6 }}
            labelFormatter={(_label, payload) => payload?.[0]?.payload.date ?? ""}
            formatter={(value, _name, item) => [
              `${formatTnd(Number(value))} in ${item.payload.transactions} transaction${item.payload.transactions === 1 ? "" : "s"}`,
              "Moved",
            ]}
            contentStyle={{
              background: "var(--card)",
              border: "2px solid var(--ink)",
              borderRadius: 8,
              color: "var(--ink)",
              fontSize: 13,
            }}
          />
          <Bar dataKey="volume" fill="var(--brand)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}