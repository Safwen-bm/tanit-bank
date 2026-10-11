"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatTnd } from "@/lib/format";
import { fromMillimes, toMillimes } from "@/lib/money";
import type { CashflowPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

function monthLabel(month: string) {
  const [year, number] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(year, number - 1, 1)));
}

export function CashflowChart({ data }: { data: CashflowPoint[] }) {
  const rows = data.map((point) => ({
    label: monthLabel(point.month),
    income: Number(point.income),
    expenses: Number(point.expenses),
  }));
  const empty = rows.every((row) => row.income === 0 && row.expenses === 0);

  const current = data[data.length - 1];
  const net = fromMillimes(toMillimes(current.income) - toMillimes(current.expenses));

  return (
    <div>
      <div className="relative h-64 w-full" role="img" aria-label="Money in and money out for each of the last months">
        {empty && (
          <p className="absolute inset-0 z-10 flex items-center justify-center text-sm text-ink-soft">
            No money movement yet. Make a deposit to see your first bars.
          </p>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid stroke="var(--rule)" strokeDasharray="3 5" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--ink-soft)", fontSize: 12 }}
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
              formatter={(value, name) => [formatTnd(Number(value)), name]}
              contentStyle={{
                background: "var(--card)",
                border: "2px solid var(--ink)",
                borderRadius: 8,
                color: "var(--ink)",
                fontSize: 13,
              }}
            />
            <Legend iconType="square" wrapperStyle={{ fontSize: 12, color: "var(--ink-soft)" }} />
            <Bar dataKey="income" name="Money in" fill="var(--positive)" radius={[4, 4, 0, 0]} maxBarSize={36} />
            <Bar dataKey="expenses" name="Money out" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <dl className="num mt-4 grid grid-cols-3 gap-3 border-t-2 border-dashed border-rule pt-4 text-sm">
        <div>
          <dt className="text-ink-soft">In this month</dt>
          <dd className="mt-1 font-semibold text-positive">{formatTnd(current.income)}</dd>
        </div>
        <div>
          <dt className="text-ink-soft">Out this month</dt>
          <dd className="mt-1 font-semibold">{formatTnd(current.expenses)}</dd>
        </div>
        <div>
          <dt className="text-ink-soft">Net</dt>
          <dd className={cn("mt-1 font-semibold", net.startsWith("-") ? "text-negative" : "text-positive")}>
            {formatTnd(net)}
          </dd>
        </div>
      </dl>
    </div>
  );
}