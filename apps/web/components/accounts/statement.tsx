"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { TransactionList, TYPE_LABELS } from "@/components/transactions/transaction-list";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { useDebounced } from "@/lib/use-debounced";
import { useHistory } from "@/lib/queries";
import type { HistoryFilters, TransactionType } from "@/lib/types";

const EMPTY: HistoryFilters = { type: "", from: "", to: "", q: "", page: 1 };

export function Statement({ accountId }: { accountId: string }) {
  const [filters, setFilters] = useState<HistoryFilters>(EMPTY);
  const debouncedQ = useDebounced(filters.q);
  const history = useHistory(accountId, { ...filters, q: debouncedQ });

  // Any filter change goes back to page 1.
  const update = (patch: Partial<HistoryFilters>) => setFilters((current) => ({ ...current, ...patch, page: 1 }));
  const filtered = filters.type || filters.from || filters.to || filters.q;
  const data = history.data;

  return (
    <section>
      <h2 className="font-display text-2xl font-semibold">Statement</h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <label className="relative block">
          <span className="sr-only">Search</span>
          <Search className="absolute top-3 left-0 size-4 text-ink-soft" aria-hidden="true" />
          <input
            value={filters.q}
            onChange={(event) => update({ q: event.target.value })}
            placeholder="Search note or IBAN"
            className={`${inputClass} pl-6`}
          />
        </label>
        <select
          aria-label="Type"
          value={filters.type}
          onChange={(event) => update({ type: event.target.value as TransactionType | "" })}
          className={inputClass}
        >
          <option value="">All types</option>
          {(Object.keys(TYPE_LABELS) as TransactionType[]).map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <input
          type="date"
          aria-label="From date"
          value={filters.from}
          onChange={(event) => update({ from: event.target.value })}
          className={`${inputClass} num`}
        />
        <input
          type="date"
          aria-label="To date"
          value={filters.to}
          onChange={(event) => update({ to: event.target.value })}
          className={`${inputClass} num`}
        />
      </div>

      {filtered && (
        <button
          onClick={() => setFilters(EMPTY)}
          className="mt-3 cursor-pointer text-sm font-medium text-brand underline underline-offset-4"
        >
          Clear filters
        </button>
      )}

      <div className="mt-4 rounded-xl border-2 border-ink bg-card px-5">
        {history.isLoading ? (
          <p className="py-10 text-center text-ink-soft">Loading...</p>
        ) : data && data.items.length > 0 ? (
          <TransactionList items={data.items} />
        ) : (
          <p className="py-10 text-center text-ink-soft">
            {filtered ? "No transactions match these filters." : "No transactions yet."}
          </p>
        )}
      </div>

      {data && data.total > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="num text-sm text-ink-soft">
            {data.total} transaction{data.total > 1 ? "s" : ""} · page {data.page} of {data.pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.pageCount}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            >
              Next
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}