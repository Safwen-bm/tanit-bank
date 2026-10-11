"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { formatDate, formatTnd } from "@/lib/format";
import { useAdminCustomers } from "@/lib/queries";
import { useDebounced } from "@/lib/use-debounced";
import { cn } from "@/lib/utils";

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const query = useAdminCustomers(q, page);
  const data = query.data;

  return (
    <div className="space-y-10">
      <header>
        <p className="num text-xs tracking-[0.25em] text-accent uppercase">Back office</p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Customers</h1>
      </header>

      <label className="relative block max-w-md">
        <span className="sr-only">Search customers</span>
        <Search className="absolute top-3 left-0 size-4 text-ink-soft" aria-hidden="true" />
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search by name or email"
          className={`${inputClass} pl-6`}
        />
      </label>

      <div className="overflow-x-auto rounded-xl border-2 border-ink bg-card">
        <table className="w-full min-w-184 text-left text-sm">
          <thead>
            <tr className="num border-b-2 border-ink text-[11px] tracking-[0.15em] text-ink-soft uppercase">
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Accounts</th>
              <th className="px-4 py-3 text-right font-medium">Balance</th>
              <th className="px-4 py-3 text-right font-medium">Loans</th>
              <th className="px-4 py-3 font-medium">Status</th>
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
              data.items.map((customer) => (
                <tr key={customer.id} className="transition-colors hover:bg-paper-2/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${customer.id}`} className="font-semibold text-brand hover:underline">
                      {customer.fullName}
                    </Link>
                    <p className="num text-xs text-ink-soft">{customer.email}</p>
                  </td>
                  <td className="num px-4 py-3 text-ink-soft">{formatDate(customer.createdAt)}</td>
                  <td className="num px-4 py-3 text-right">{customer.accounts}</td>
                  <td className="num px-4 py-3 text-right font-semibold">{formatTnd(customer.totalBalance)}</td>
                  <td className="num px-4 py-3 text-right">{customer.activeLoans}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "num rounded border px-2 py-0.5 text-[10px] tracking-wider uppercase",
                        customer.isActive ? "border-positive text-positive" : "border-negative text-negative",
                      )}
                    >
                      {customer.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-soft">
                  {q ? "No customer matches this search." : "No customers yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="num text-sm text-ink-soft">
            {data.total} customer{data.total > 1 ? "s" : ""} · page {data.page} of {data.pageCount}
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