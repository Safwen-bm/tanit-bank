"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatTnd } from "@/lib/format";
import type { ScheduleRow } from "@/lib/types";

export function BalanceChart({ schedule, amount }: { schedule: ScheduleRow[]; amount: string }) {
  const data = [
    { month: 0, remaining: Number(amount) },
    ...schedule.map((row) => ({ month: row.number, remaining: Number(row.remaining) })),
  ];

  return (
    <div className="h-64 w-full" role="img" aria-label="Remaining balance over the life of the loan">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--rule)" strokeDasharray="3 5" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--rule)" }}
            tickFormatter={(value) => `${value}m`}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : String(value))}
          />
          <Tooltip
            formatter={(value) => [formatTnd(Number(value)), "Remaining"]}
            labelFormatter={(label) => `After month ${label}`}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--ink)",
              borderRadius: 0,
              color: "var(--ink)",
              fontSize: 13,
            }}
          />
          <Area
            type="monotone"
            dataKey="remaining"
            stroke="var(--brand)"
            strokeWidth={3}
            fill="url(#balanceFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
