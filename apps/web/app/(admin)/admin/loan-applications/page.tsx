"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { ApplicationCard } from "@/components/admin/application-card";
import { Button } from "@/components/ui/button";
import { useAdminApplications } from "@/lib/queries";
import type { ApplicationFilter } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS: { value: ApplicationFilter; label: string }[] = [
  { value: "PENDING", label: "To review" },
  { value: "APPROVED", label: "Active" },
  { value: "REJECTED", label: "Declined" },
  { value: "PAID_OFF", label: "Paid off" },
  { value: "ALL", label: "All" },
];

export default function AdminApplicationsPage() {
  const [status, setStatus] = useState<ApplicationFilter>("PENDING");
  const [page, setPage] = useState(1);
  const query = useAdminApplications(status, page);
  const data = query.data;

  const countFor = (value: ApplicationFilter) =>
    data ? (value === "ALL" ? Object.values(data.counts).reduce((a, b) => a + b, 0) : data.counts[value]) : null;

  return (
    <div className="space-y-10">
      <header>
        <p className="num text-xs tracking-[0.25em] text-accent uppercase">Back office</p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Loan applications</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Approving pays the money out through the ledger, builds the repayment schedule and notifies the customer in a
          single step. Applications over the debt ratio need an explicit override.
        </p>
      </header>

      <div role="tablist" className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const count = countFor(tab.value);
          const active = status === tab.value;
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-colors",
                active ? "border-ink bg-ink text-paper" : "border-rule text-ink-soft hover:border-ink hover:text-ink",
              )}
            >
              {tab.label}
              {count !== null && <span className="num text-xs opacity-70">{count}</span>}
            </button>
          );
        })}
      </div>

      {query.isLoading ? (
        <p className="text-ink-soft">Loading...</p>
      ) : data && data.items.length > 0 ? (
        <div className="space-y-5">
          {data.items.map((item) => (
            <ApplicationCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border-2 border-dashed border-rule p-10 text-center text-ink-soft">
          {status === "PENDING" ? "Nothing waiting for review. Nice." : "No applications here."}
        </p>
      )}

      {data && data.pageCount > 1 && (
        <div className="flex items-center justify-between">
          <p className="num text-sm text-ink-soft">
            Page {data.page} of {data.pageCount}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
              <ChevronLeft className="size-4" aria-hidden="true" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pageCount}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}