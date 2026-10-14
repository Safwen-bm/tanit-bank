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
      <div className="overflow-x-auto border border-ink/20 bg-card">
        <table className="num w-full min-w-160 text-right text-sm">
          <thead>
            <tr className="border-b-2 border-ink font-sans text-xs text-ink-soft">
              <th className="px-4 py-3 text-left font-semibold">#</th>
              <th className="px-4 py-3 text-left font-semibold">Due</th>
              <th className="px-4 py-3 font-semibold">Payment</th>
              <th className="px-4 py-3 font-semibold">Principal</th>
              <th className="px-4 py-3 font-semibold">Interest</th>
              <th className="px-4 py-3 font-semibold">Remaining</th>
              {hasStatus && <th className="px-4 py-3 font-semibold">Status</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
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
                      <span className="inline-flex items-center gap-1 font-sans font-semibold text-positive">
                        <Check className="size-4" aria-hidden="true" />
                        Paid
                      </span>
                    ) : (
                      <span className="font-sans text-ink-soft">Due</span>
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
