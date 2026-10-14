"use client";

import { useState } from "react";
import { formatTnd } from "@/lib/format";
import type { ScheduleRow } from "@/lib/types";
import { Button } from "../ui/button";

const PREVIEW = 12;

export function ScheduleTable({ schedule }: { schedule: ScheduleRow[] }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? schedule : schedule.slice(0, PREVIEW);
  const money = (value: string) => formatTnd(value).replace(" TND", "");

  return (
    <div>
      <div className="overflow-x-auto border border-ink/20 bg-card">
        <table className="num w-full min-w-136 text-right text-sm">
          <thead>
            <tr className="border-b-2 border-ink font-sans text-xs text-ink-soft">
              <th className="px-4 py-3 text-left font-semibold">Month</th>
              <th className="px-4 py-3 font-semibold">Payment</th>
              <th className="px-4 py-3 font-semibold">Principal</th>
              <th className="px-4 py-3 font-semibold">Interest</th>
              <th className="px-4 py-3 font-semibold">Remaining</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows.map((row) => (
              <tr key={row.number}>
                <td className="px-4 py-2.5 text-left text-ink-soft">{row.number}</td>
                <td className="px-4 py-2.5 font-semibold">{money(row.payment)}</td>
                <td className="px-4 py-2.5">{money(row.principal)}</td>
                <td className="px-4 py-2.5 text-accent">{money(row.interest)}</td>
                <td className="px-4 py-2.5">{money(row.remaining)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {schedule.length > PREVIEW && (
        <div className="mt-4 text-center">
          <Button variant="outline" size="sm" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "Show fewer rows" : `Show all ${schedule.length} months`}
          </Button>
        </div>
      )}
    </div>
  );
}
