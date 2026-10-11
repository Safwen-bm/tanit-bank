"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { TYPE_LABELS } from "@/components/transactions/transaction-list";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { formatDateTime, formatTnd } from "@/lib/format";
import { useAdminTransactions } from "@/lib/queries";
import type { AdminTxFilters, TransactionType } from "@/lib/types";
import { useDebounced } from "@/lib/use-debounced";

const EMPTY: AdminTxFilters = { type: "", from: "", to: "", q: "", page: 1 };

export default function AdminTransactionsPage() {
  const [filters, setFilters] = useState<AdminTxFilters>(EMPTY);
  const q = useDebounced(filters.q);
  const query = useAdminTransactions({ ...filters, q });
  const data = query.data;

  const update = (patch: Partial<AdminTxFilters>) => setFilters((current) => ({ ...current, ...patch, page: 1 }));
  const filtered = !!(filters.type || filters.from || filters.to || filters.q);

  return (
    <div className="space-y-10">
      <header>
        <p className="num text-xs tracking-[0.25em] text-accent uppercase">Back office</p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Transactions</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">Every movement of money in the bank, newest first.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <label className="relative block">
          <span className="sr-only">Search</span>
          <Search className="absolute top-3 left-0 size-4 text-ink-soft" aria-hidden="true" />
          <input
            value={filters.q}
            onChange={(event) => update({ q: event.target.value })}
            placeholder="Name, email, IBAN or note"
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
          className="-mt-6 cursor-pointer text-sm font-medium text-brand underline underline-offset-4"
        >
          Clear filters
        </button>
      )}

      <div className="overflow-x-auto rounded-xl border-2 border-ink bg-card">
        <table className="w-full min-w-208 text-left text-sm">
          <thead>
            <tr className="num border-b-2 border-ink text-[11px] tracking-[0.15em] text-ink-soft uppercase">
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">From</th>
              <th className="px-4 py-3 font-medium">To</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {query.isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-soft">
                  Loading...
                </td>
              </tr>
            ) : data && data.items.length > 0 ? (
              data.items.map((tx) => (
                <tr key={tx.id}>
                  <td className="num px-4 py-3 whitespace-nowrap text-ink-soft">{formatDateTime(tx.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{TYPE_LABELS[tx.type]}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{tx.from?.name ?? "-"}</p>
                    <p className="num text-xs text-ink-soft">{tx.from?.iban.slice(-8)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{tx.to?.name ?? "-"}</p>
                    <p className="num text-xs text-ink-soft">{tx.to?.iban.slice(-8)}</p>
                  </td>
                  <td className="num px-4 py-3 text-right font-semibold whitespace-nowrap">{formatTnd(tx.amount)}</td>
                  <td className="max-w-48 truncate px-4 py-3 text-ink-soft">{tx.description ?? "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-soft">
                  {filtered ? "No transaction matches these filters." : "No transactions yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between">
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
    </div>
  );
}