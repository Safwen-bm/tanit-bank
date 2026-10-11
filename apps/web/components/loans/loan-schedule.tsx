"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { formatDate, formatTnd } from "@/lib/format";
import type { LoanScheduleRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export function LoanSchedule({ schedule, preview = 12 }: { schedule: LoanScheduleRow[]; preview?: number }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? schedule : schedule.slice(0, preview);
  const money = (value: string) => formatTnd(value).replace(" TND", "");
  const hasStatus = schedule.some((row) => row.status);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border-2 border-ink bg-card">
        <table className="num w-full min-w-[40rem] text-right text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-[11px] tracking-[0.15em] text-ink-soft uppercase">
              <th className="px-4 py-3 text-left font-medium">#</th>
              <th className="px-4 py-3 text-left font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Principal</th>
              <th className="px-4 py-3 font-medium">Interest</th>
              <th className="px-4 py-3 font-medium">Remaining</th>
              {hasStatus && <th className="px-4 py-3 font-medium">Status</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {rows.map((row) => (
              <tr key={row.number} className={cn(row.status === "PAID" && "text-ink-soft")}>
                <td className="px-4 py-2.5 text-left text-ink-soft">{row.number}</td>
                <td className="px-4 py-2.5 text-left">{row.dueDate ? formatDate(row.dueDate) : "-"}</td>
                <td className="px-4 py-2.5 font-semibold">{money(row.payment)}</td>
                <td className="px-4 py-2.5">{money(row.principal)}</td>
                <td className="px-4 py-2.5">{money(row.interest)}</td>
                <td className="px-4 py-2.5">{money(row.remaining)}</td>
                {hasStatus && (
                  <td className="px-4 py-2.5">
                    {row.status === "PAID" ? (
                      <span className="inline-flex items-center gap-1 text-positive">
                        <Check className="size-4" aria-hidden="true" />
                        Paid
                      </span>
                    ) : (
                      <span className="text-ink-soft">Due</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {schedule.length > preview && (
        <div className="mt-4 text-center">
          <Button variant="outline" size="sm" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "Show fewer rows" : `Show all ${schedule.length} months`}
          </Button>
        </div>
      )}
    </div>
  );
}