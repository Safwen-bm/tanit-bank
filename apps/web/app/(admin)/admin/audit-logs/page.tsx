// apps\web\app\(admin)\admin\audit-logs\page.tsx
"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { formatDateTime } from "@/lib/format";
import { useAdminAudit } from "@/lib/queries";
import type { AuditFilters, AuditItem } from "@/lib/types";
import { useDebounced } from "@/lib/use-debounced";

const EMPTY: AuditFilters = { action: "", from: "", to: "", q: "", page: 1 };

const LABELS: Record<string, string> = {
  AUTH_REGISTER: "Registered",
  AUTH_LOGIN: "Signed in",
  AUTH_LOGIN_FAILED: "Failed sign-in",
  AUTH_LOGOUT: "Signed out",
  AUTH_TOKEN_REUSE_DETECTED: "Stolen session detected",
  PROFILE_UPDATE: "Profile updated",
  ACCOUNT_OPEN: "Account opened",
  ACCOUNT_STATUS: "Account status changed",
  TX_DEPOSIT: "Deposit",
  TX_WITHDRAWAL: "Withdrawal",
  TX_TRANSFER: "Transfer",
  TX_CARD_PAYMENT: "Card payment",
  LOAN_PRODUCT_CREATE: "Loan product created",
  LOAN_PRODUCT_UPDATE: "Loan product changed",
  LOAN_PRODUCT_DELETE: "Loan product deleted",
  LOAN_APPLY: "Loan application",
  LOAN_APPROVE: "Loan approved",
  LOAN_REJECT: "Loan declined",
  LOAN_DISBURSEMENT: "Loan disbursed",
  LOAN_REPAY: "Loan instalment paid",
  CUSTOMER_DEACTIVATE: "Customer deactivated",
  CUSTOMER_REACTIVATE: "Customer reactivated",
  CARD_ISSUE: "Card issued",
  CARD_UPDATE: "Card changed",
  STATEMENT_DOWNLOAD: "Statement downloaded",
};

const label = (action: string) =>
  LABELS[action] ?? action.toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

function Details({ item }: { item: AuditItem }) {
  if (!item.metadata || Object.keys(item.metadata).length === 0) return <span className="text-ink-soft">-</span>;
  const entries = Object.entries(item.metadata);
  const compact = entries
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${typeof value === "object" ? "…" : String(value)}`)
    .join(" · ");
  return (
    <details className="group">
      <summary className="num cursor-pointer list-none truncate text-xs text-ink-soft marker:hidden hover:text-ink">
        {compact}
      </summary>
      <pre className="num mt-2 max-w-md overflow-x-auto rounded-lg border border-rule bg-paper-2/60 p-3 text-xs whitespace-pre-wrap">
        {JSON.stringify(item.metadata, null, 2)}
      </pre>
    </details>
  );
}

export default function AdminAuditPage() {
  const [filters, setFilters] = useState<AuditFilters>(EMPTY);
  const q = useDebounced(filters.q);
  const query = useAdminAudit({ ...filters, q });
  const data = query.data;

  const update = (patch: Partial<AuditFilters>) => setFilters((current) => ({ ...current, ...patch, page: 1 }));
  const filtered = !!(filters.action || filters.from || filters.to || filters.q);

  return (
    <div className="space-y-10">
      <header>
        <p className="num text-xs tracking-[0.25em] text-accent uppercase">Back office</p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Audit log</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Every sensitive action, who did it and when. Entries can be read here but never edited or deleted.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <label className="relative block">
          <span className="sr-only">Search</span>
          <Search className="absolute top-3 left-0 size-4 text-ink-soft" aria-hidden="true" />
          <input
            value={filters.q}
            onChange={(event) => update({ q: event.target.value })}
            placeholder="Who, entity id or IP"
            className={`${inputClass} pl-6`}
          />
        </label>
        <select aria-label="Action" value={filters.action} onChange={(event) => update({ action: event.target.value })} className={inputClass}>
          <option value="">All actions</option>
          {data?.actions.map((action) => (
            <option key={action} value={action}>
              {label(action)}
            </option>
          ))}
        </select>
        <input type="date" aria-label="From date" value={filters.from} onChange={(event) => update({ from: event.target.value })} className={`${inputClass} num`} />
        <input type="date" aria-label="To date" value={filters.to} onChange={(event) => update({ to: event.target.value })} className={`${inputClass} num`} />
      </div>
      {filtered && (
        <button onClick={() => setFilters(EMPTY)} className="-mt-6 cursor-pointer text-sm font-medium text-brand underline underline-offset-4">
          Clear filters
        </button>
      )}

      <div className="overflow-x-auto rounded-xl border-2 border-ink bg-card">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead>
            <tr className="num border-b-2 border-ink text-[11px] tracking-[0.15em] text-ink-soft uppercase">
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Who</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Entity</th>
              <th className="px-4 py-3 font-medium">Details</th>
              <th className="px-4 py-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule align-top">
            {query.isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-soft">
                  Loading...
                </td>
              </tr>
            ) : data && data.items.length > 0 ? (
              data.items.map((item) => (
                <tr key={item.id}>
                  <td className="num px-4 py-3 whitespace-nowrap text-ink-soft">{formatDateTime(item.createdAt)}</td>
                  <td className="px-4 py-3">
                    {item.actor ? (
                      <>
                        <p className="font-medium">{item.actor.fullName}</p>
                        <p className="num text-xs text-ink-soft">{item.actor.role === "ADMIN" ? "Admin" : item.actor.email}</p>
                      </>
                    ) : (
                      <span className="text-ink-soft">Anonymous</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{label(item.action)}</p>
                    <p className="num text-[11px] text-ink-soft">{item.action}</p>
                  </td>
                  <td className="num px-4 py-3 text-xs text-ink-soft">
                    {item.entity ?? "-"}
                    {item.entityId && <span className="block">{item.entityId.slice(-8)}</span>}
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <Details item={item} />
                  </td>
                  <td className="num px-4 py-3 text-xs whitespace-nowrap text-ink-soft">{item.ip ?? "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-soft">
                  {filtered ? "No entry matches these filters." : "Nothing recorded yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="num text-sm text-ink-soft">
            {data.total} entr{data.total > 1 ? "ies" : "y"} · page {data.page} of {data.pageCount}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={data.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>
              <ChevronLeft className="size-4" aria-hidden="true" />
              Prev
            </Button>
            <Button variant="outline" size="sm" disabled={data.page >= data.pageCount} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>
              Next
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}