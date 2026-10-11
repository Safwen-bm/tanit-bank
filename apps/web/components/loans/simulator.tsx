"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ButtonLink } from "@/components/ui/button-link";
import { api } from "@/lib/api";
import { formatTnd } from "@/lib/format";
import { fractionToPercent } from "@/lib/money";
import { usePublicProducts } from "@/lib/queries";
import type { LoanProduct, Simulation } from "@/lib/types";
import { useDebounced } from "@/lib/use-debounced";
import { cn } from "@/lib/utils";
import { BalanceChart } from "./balance-chart";
import { ScheduleTable } from "./schedule-table";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const nf = new Intl.NumberFormat("fr-TN");

function amountStep(product: LoanProduct) {
  const range = Number(product.maxAmount) - Number(product.minAmount);
  return range > 100_000 ? 1000 : range > 10_000 ? 500 : range > 2_000 ? 100 : 50;
}

function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  suffix,
  onSlide,
  onType,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onSlide: (value: number) => void;
  onType: (raw: string) => void;
}) {
  const [raw, setRaw] = useState<string | null>(null);
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <label htmlFor={id} className="num text-[11px] tracking-[0.18em] text-ink-soft uppercase">
          {label}
        </label>
        <div className="flex items-baseline gap-2 border-b-2 border-rule focus-within:border-brand">
          <input
            id={id}
            inputMode="numeric"
            value={raw ?? String(value)}
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, "");
              setRaw(digits);
              onType(digits);
            }}
            onBlur={() => setRaw(null)}
            className="num w-28 bg-transparent text-right text-2xl font-semibold outline-none"
          />
          <span className="text-sm text-ink-soft">{suffix}</span>
        </div>
      </div>
      <input
        type="range"
        aria-label={`${label} slider`}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          setRaw(null);
          onSlide(Number(event.target.value));
        }}
        className="mt-4 h-2 w-full cursor-pointer accent-brand"
      />
      <div className="num mt-1 flex justify-between text-xs text-ink-soft">
        <span>{nf.format(min)}</span>
        <span>{nf.format(max)}</span>
      </div>
    </div>
  );
}

export function LoanSimulator() {
  const { status, user } = useAuth();
  const products = usePublicProducts();
  const preselected = useSearchParams().get("product");

  const [productId, setProductId] = useState<string | null>(preselected);
  const [amount, setAmount] = useState<number | null>(null);
  const [months, setMonths] = useState<number | null>(null);

  const list = products.data ?? [];
  const product = list.find((item) => item.id === productId) ?? list[0];

  // Everything is clamped at render time, so switching product can never leave a value out of range.
  const aMin = product ? Math.ceil(Number(product.minAmount)) : 0;
  const aMax = product ? Math.floor(Number(product.maxAmount)) : 0;
  const mMin = product?.minMonths ?? 0;
  const mMax = product?.maxMonths ?? 0;
  const effAmount = product ? clamp(amount ?? Math.round((aMin + (aMax - aMin) * 0.2) / 100) * 100, aMin, aMax) : 0;
  const effMonths = product ? clamp(months ?? Math.round(mMin + (mMax - mMin) * 0.4), mMin, mMax) : 0;

  const debouncedAmount = useDebounced(effAmount, 250);
  const debouncedMonths = useDebounced(effMonths, 250);

  const simulation = useQuery({
    queryKey: ["simulation", product?.id, debouncedAmount, debouncedMonths],
    queryFn: () =>
      api<Simulation>("/public/loan-simulations", {
        method: "POST",
        auth: false,
        body: { productId: product!.id, amount: String(debouncedAmount), months: debouncedMonths },
      }),
    enabled: !!product && debouncedAmount > 0 && debouncedMonths > 0,
    placeholderData: keepPreviousData,
  });

  if (products.isLoading) return <p className="text-ink-soft">Loading loan products...</p>;
  if (!product) {
    return (
      <div className="rounded-xl border-2 border-dashed border-rule p-10 text-center">
        <p className="font-display text-xl">No loan products are available right now.</p>
        <p className="mt-2 text-sm text-ink-soft">The bank has not published any conditions yet. Please come back soon.</p>
      </div>
    );
  }

  const result = simulation.data;
  const interestShare = result ? (Number(result.totalInterest) / Number(result.totalPayment)) * 100 : 0;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,400px)_1fr] lg:items-start">
      <section aria-label="Loan settings" className="space-y-9 rounded-xl border-2 border-ink bg-card p-6 shadow-[4px_4px_0_0_var(--ink)]">
        <fieldset>
          <legend className="num mb-3 text-[11px] tracking-[0.18em] text-ink-soft uppercase">Loan type</legend>
          <div className="grid gap-2">
            {list.map((item) => {
              const active = item.id === product.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setProductId(item.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors",
                    active ? "border-ink bg-ink text-paper" : "border-rule hover:border-ink",
                  )}
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="num text-sm">{Number(item.annualRate).toFixed(2)} %</span>
                </button>
              );
            })}
          </div>
          {product.description && <p className="mt-3 text-sm text-ink-soft">{product.description}</p>}
        </fieldset>

        <Slider
          id="amount"
          label="Amount"
          value={effAmount}
          min={aMin}
          max={aMax}
          step={amountStep(product)}
          suffix="TND"
          onSlide={setAmount}
          onType={(raw) => raw && setAmount(Number(raw))}
        />
        <Slider
          id="months"
          label="Duration"
          value={effMonths}
          min={mMin}
          max={mMax}
          step={1}
          suffix="months"
          onSlide={setMonths}
          onType={(raw) => raw && setMonths(Number(raw))}
        />
      </section>

      <section aria-label="Result" aria-live="polite" className="min-w-0 space-y-8">
        {simulation.error && !result ? (
          <div role="alert" className="rounded-xl border-2 border-negative p-6 text-negative">
            {simulation.error.message}
          </div>
        ) : (
          <>
            <div className="relative overflow-hidden rounded-xl border-2 border-ink bg-brand p-8 text-brand-ink shadow-[6px_6px_0_0_var(--ink)]">
              <div className="tiles absolute inset-0 opacity-60" aria-hidden="true" />
              <div className="relative">
                <p className="num text-[11px] tracking-[0.2em] uppercase opacity-80">Your monthly payment</p>
                <p className={cn("num mt-2 text-5xl font-semibold sm:text-6xl", simulation.isPlaceholderData && "opacity-60")}>
                  {result ? formatTnd(result.monthlyPayment) : "..."}
                </p>
                {result && (
                  <p className="mt-3 text-sm opacity-80">
                    over {result.months} months at {Number(result.annualRate).toFixed(2)} % a year
                  </p>
                )}
              </div>
            </div>

            {result && (
              <>
                <dl className="grid gap-4 sm:grid-cols-3">
                  {[
                    ["Amount borrowed", formatTnd(result.amount)],
                    ["Total interest", formatTnd(result.totalInterest)],
                    ["Total to repay", formatTnd(result.totalPayment)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-rule bg-card p-4">
                      <dt className="num text-[11px] tracking-[0.15em] text-ink-soft uppercase">{label}</dt>
                      <dd className="num mt-1 text-lg font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div>
                  <div className="flex h-3 overflow-hidden rounded-full border border-ink" aria-hidden="true">
                    <div className="bg-brand" style={{ width: `${100 - interestShare}%` }} />
                    <div className="bg-accent" style={{ width: `${interestShare}%` }} />
                  </div>
                  <div className="num mt-2 flex justify-between text-xs text-ink-soft">
                    <span>Principal {(100 - interestShare).toFixed(1)} %</span>
                    <span className="text-accent">Interest {interestShare.toFixed(1)} %</span>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-dashed border-rule p-5 text-sm">
                  <p>
                    To stay within this product&apos;s {fractionToPercent(result.product.maxDebtRatio)} % debt ratio, a
                    monthly income of about{" "}
                    <strong className="num whitespace-nowrap">{formatTnd(result.minimumIncome)}</strong> is expected.
                  </p>
                  {status !== "authenticated" && (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <ButtonLink href="/register" size="sm">
                        Open an account to apply
                      </ButtonLink>
                      <span className="text-ink-soft">The simulation above is not saved anywhere.</span>
                    </div>
                  )}
                  {status === "authenticated" && user?.role === "CUSTOMER" && (
                    <div className="mt-4">
                      <ButtonLink
                        href={`/loans/apply?product=${product.id}&amount=${debouncedAmount}&months=${debouncedMonths}`}
                        size="sm"
                      >
                        Apply for this loan
                      </ButtonLink>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="font-display text-xl font-semibold">Remaining balance</h2>
                  <div className="mt-3 rounded-xl border-2 border-ink bg-card p-4">
                    <BalanceChart schedule={result.schedule} amount={result.amount} />
                  </div>
                </div>

                <div>
                  <h2 className="font-display mb-3 text-xl font-semibold">Repayment schedule</h2>
                  <ScheduleTable schedule={result.schedule} />
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}