// apps\web\app\(admin)\admin\customers\[id]\page.tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AccountAdminCard } from "@/components/admin/account-admin-card";
import { StatusBadge } from "@/components/loans/status-badge";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatTnd } from "@/lib/format";
import { useAdminCustomer } from "@/lib/queries";
import { cn } from "@/lib/utils";

export default function AdminCustomerPage() {
  const { id } = useParams<{ id: string }>();
  const query = useAdminCustomer(id);
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const toggle = useMutation({
    mutationFn: (isActive: boolean) =>
      api(`/admin/customers/${id}/status`, { method: "PATCH", body: { isActive } }),
    onSuccess: (_data, isActive) => {
      toast.success(isActive ? "Customer reactivated" : "Customer deactivated and signed out everywhere");
      setConfirming(false);
      void queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.message),
  });

  if (query.isLoading) return <p className="text-ink-soft">Loading...</p>;
  if (query.error || !query.data) {
    const missing = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="rounded-xl border-2 border-dashed border-rule p-10 text-center">
        <p className="font-display text-xl">{missing ? "Customer not found." : "Something went wrong."}</p>
        <Link href="/admin/customers" className="mt-3 inline-block text-sm font-semibold text-brand underline underline-offset-4">
          Back to customers
        </Link>
      </div>
    );
  }

  const customer = query.data;

  return (
    <div className="space-y-12">
      <Link href="/admin/customers" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Customers
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <p className="num text-xs tracking-[0.25em] text-accent uppercase">Customer</p>
            <span
              className={cn(
                "num rounded border px-2 py-0.5 text-[10px] tracking-wider uppercase",
                customer.isActive ? "border-positive text-positive" : "border-negative text-negative",
              )}
            >
              {customer.isActive ? "Active" : "Deactivated"}
            </span>
          </div>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{customer.fullName}</h1>
          <p className="num mt-2 text-sm text-ink-soft">{customer.email}</p>
        </div>

        <div className="flex gap-2">
          {customer.isActive ? (
            confirming ? (
              <>
                <Button loading={toggle.isPending} onClick={() => toggle.mutate(false)}>
                  Confirm deactivation
                </Button>
                <Button variant="ghost" onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setConfirming(true)}>
                Deactivate
              </Button>
            )
          ) : (
            <Button loading={toggle.isPending} onClick={() => toggle.mutate(true)}>
              Reactivate
            </Button>
          )}
        </div>
      </header>

      <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Declared income", customer.profile ? formatTnd(customer.profile.monthlyIncome) : "Not set"],
          ["Phone", customer.profile?.phone ?? "Not given"],
          ["Address", customer.profile?.address ?? "Not given"],
          ["Customer since", formatDate(customer.createdAt)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-rule bg-card p-4">
            <dt className="num text-[11px] tracking-[0.15em] text-ink-soft uppercase">{label}</dt>
            <dd className="num mt-1 font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h2 className="font-display text-2xl font-semibold">Accounts</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Freezing blocks every transfer in or out at once. An account can only be closed when its balance is zero and no
          loan depends on it.
        </p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {customer.accounts.map((account) => (
            <AccountAdminCard key={account.id} account={account} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold">Loans</h2>
        {customer.loans.length > 0 ? (
          <ul className="mt-4 divide-y divide-rule rounded-xl border-2 border-ink bg-card px-5">
            {customer.loans.map((loan) => (
              <li key={loan.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium">{loan.product.name}</p>
                    <StatusBadge status={loan.status} />
                  </div>
                  <p className="num text-sm text-ink-soft">
                    {loan.durationMonths} months at {Number(loan.interestRate).toFixed(2)} % · applied{" "}
                    {formatDate(loan.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="num font-semibold">{formatTnd(loan.amount)}</p>
                  <p className="num text-sm text-ink-soft">{formatTnd(loan.monthlyPayment)} / month</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-ink-soft">No loans.</p>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold">Recent activity</h2>
        <div className="mt-4 rounded-xl border-2 border-ink bg-card px-5">
          {customer.recent.length > 0 ? (
            <TransactionList items={customer.recent} />
          ) : (
            <p className="py-10 text-center text-ink-soft">No transactions yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}