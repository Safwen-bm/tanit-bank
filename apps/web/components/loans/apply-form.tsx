"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { api } from "@/lib/api";
import { formatTnd } from "@/lib/format";
import { fractionToPercent, sumMoney } from "@/lib/money";
import { useAccounts, useMyLoans, usePublicProducts } from "@/lib/queries";
import type { LoanDetail, Simulation } from "@/lib/types";
import { useDebounced } from "@/lib/use-debounced";

interface Me {
  profile: { monthlyIncome: string } | null;
}

export function ApplyForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useSearchParams();

  const products = usePublicProducts();
  const accounts = useAccounts();
  const loans = useMyLoans();
  const me = useQuery({ queryKey: ["me"], queryFn: () => api<Me>("/users/me") });

  const [productId, setProductId] = useState(params.get("product") ?? "");
  const [amount, setAmount] = useState(params.get("amount") ?? "");
  const [months, setMonths] = useState(params.get("months") ?? "");
  const [accountId, setAccountId] = useState("");
  const [purpose, setPurpose] = useState("");

  const product = products.data?.find((item) => item.id === productId) ?? products.data?.[0];
  const activeAccounts = accounts.data?.filter((account) => account.status === "ACTIVE") ?? [];
  const receiving = activeAccounts.find((account) => account.id === accountId) ?? activeAccounts[0];

  const amountText = amount || (product ? String(Math.ceil(Number(product.minAmount))) : "");
  const monthsText = months || (product ? String(product.minMonths) : "");

  let amountError: string | undefined;
  if (product) {
    if (!/^\d{1,9}(\.\d{1,3})?$/.test(amountText)) amountError = "Enter an amount like 5000";
    else if (Number(amountText) < Number(product.minAmount)) amountError = `Minimum is ${formatTnd(product.minAmount)}`;
    else if (Number(amountText) > Number(product.maxAmount)) amountError = `Maximum is ${formatTnd(product.maxAmount)}`;
  }
  let monthsError: string | undefined;
  if (product) {
    if (!/^\d{1,3}$/.test(monthsText)) monthsError = "Whole months";
    else if (Number(monthsText) < product.minMonths) monthsError = `Minimum is ${product.minMonths} months`;
    else if (Number(monthsText) > product.maxMonths) monthsError = `Maximum is ${product.maxMonths} months`;
  }
  const valid = !!product && !!receiving && !amountError && !monthsError;

  const debouncedAmount = useDebounced(amountText, 300);
  const debouncedMonths = useDebounced(monthsText, 300);
  const preview = useQuery({
    queryKey: ["apply-preview", product?.id, debouncedAmount, debouncedMonths],
    queryFn: () =>
      api<Simulation>("/public/loan-simulations", {
        method: "POST",
        auth: false,
        body: { productId: product!.id, amount: debouncedAmount, months: Number(debouncedMonths) },
      }),
    enabled: valid,
    placeholderData: keepPreviousData,
    retry: false,
  });

  // Display-only estimate; the server computes the authoritative ratio when the application is received.
  const income = me.data?.profile?.monthlyIncome;
  const commitments = sumMoney(loans.data?.filter((loan) => loan.status === "APPROVED").map((loan) => loan.monthlyPayment) ?? []);
  const estimate =
    preview.data && income && Number(income) > 0
      ? ((Number(preview.data.monthlyPayment) + Number(commitments)) / Number(income)) * 100
      : null;
  const limit = product ? Number(fractionToPercent(product.maxDebtRatio)) : 0;
  const overLimit = estimate !== null && estimate > limit;

  const submit = useMutation({
    mutationFn: () =>
      api<LoanDetail>("/loans", {
        method: "POST",
        body: {
          productId: product!.id,
          accountId: receiving!.id,
          amount: amountText,
          months: Number(monthsText),
          purpose: purpose.trim() || undefined,
        },
      }),
    onSuccess: (loan) => {
      toast.success("Application sent");
      void queryClient.invalidateQueries();
      router.push(`/loans/${loan.id}`);
    },
    onError: (error) => toast.error(error.message),
  });

  if (products.isLoading || accounts.isLoading) return <p className="text-ink-soft">Loading...</p>;
  if (!product) return <p className="text-ink-soft">No loan products are available right now.</p>;
  if (activeAccounts.length === 0) {
    return <p className="text-negative">You need an active account to receive the money.</p>;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) submit.mutate();
        }}
        className="space-y-7 rounded-xl border-2 border-ink bg-card p-8 shadow-[4px_4px_0_0_var(--ink)]"
        noValidate
      >
        <Field label="Loan type" htmlFor="product">
          <select
            id="product"
            value={product.id}
            onChange={(event) => setProductId(event.target.value)}
            className={inputClass}
          >
            {products.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {Number(item.annualRate).toFixed(2)} %
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-7 sm:grid-cols-2">
          <Field label="Amount (TND)" htmlFor="amount" error={amountError}>
            <input
              id="amount"
              inputMode="decimal"
              value={amountText}
              onChange={(event) => setAmount(event.target.value)}
              className={`${inputClass} num`}
            />
          </Field>
          <Field label="Duration (months)" htmlFor="months" error={monthsError}>
            <input
              id="months"
              inputMode="numeric"
              value={monthsText}
              onChange={(event) => setMonths(event.target.value)}
              className={`${inputClass} num`}
            />
          </Field>
        </div>

        <Field label="Pay the money into" htmlFor="account">
          <select
            id="account"
            value={receiving?.id}
            onChange={(event) => setAccountId(event.target.value)}
            className={inputClass}
          >
            {activeAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.label ?? account.type} · {formatTnd(account.balance)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="What is it for? (optional)" htmlFor="purpose">
          <input id="purpose" maxLength={200} value={purpose} onChange={(event) => setPurpose(event.target.value)} className={inputClass} />
        </Field>

        <Button type="submit" loading={submit.isPending} disabled={!valid} className="w-full">
          Send application
        </Button>
      </form>

      <aside className="space-y-5" aria-live="polite">
        <div className="rounded-xl border-2 border-ink bg-brand p-6 text-brand-ink shadow-[4px_4px_0_0_var(--ink)]">
          <p className="num text-[11px] tracking-[0.2em] uppercase opacity-80">Monthly payment</p>
          <p className="num mt-1 text-4xl font-semibold">
            {preview.data && valid ? formatTnd(preview.data.monthlyPayment) : "..."}
          </p>
          {preview.data && valid && (
            <p className="num mt-3 text-sm opacity-80">
              Total interest {formatTnd(preview.data.totalInterest)} · total {formatTnd(preview.data.totalPayment)}
            </p>
          )}
        </div>

        {preview.error && valid && (
          <p role="alert" className="rounded-lg border-2 border-negative px-4 py-3 text-sm text-negative">
            {preview.error.message}
          </p>
        )}

        {estimate !== null && (
          <div
            className={`rounded-xl border-2 p-5 text-sm ${overLimit ? "border-gold" : "border-dashed border-rule"}`}
          >
            <p className="flex items-center gap-2 font-semibold">
              {overLimit && <TriangleAlert className="size-4 text-gold" aria-hidden="true" />}
              About {estimate.toFixed(1)} % of your declared income
            </p>
            <p className="mt-1 text-ink-soft">
              {overLimit
                ? `This product allows ${limit} %. You can still apply, but the bank will look at it more closely.`
                : `Within this product's ${limit} % limit.`}
              {Number(commitments) > 0 && ` Includes ${formatTnd(commitments)} of existing monthly payments.`}
            </p>
          </div>
        )}

        <p className="text-sm text-ink-soft">
          The rate shown today is locked in when you apply. If the bank changes it later, your application keeps its rate.
        </p>
      </aside>
    </div>
  );
}