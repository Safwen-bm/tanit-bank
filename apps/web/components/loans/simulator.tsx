"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { useAuth } from "@/components/auth-provider";
import { ButtonLink } from "@/components/ui/button-link";
import { Guilloche } from "@/components/ui/guilloche";
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
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
        <div className="flex items-baseline gap-2 border-b-2 border-ink pb-1 focus-within:border-brand">
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
        style={{ "--fill": `${fill}%` } as CSSProperties}
        className="slider mt-4"
      />
      <div className="num flex justify-between text-xs text-ink-soft">
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
      <div className="border-2 border-dashed border-ink/25 p-12 text-center">
        <p className="font-display text-3xl">No loan products are available right now.</p>
        <p className="mt-3 text-ink-soft">The bank has not published any conditions yet. Please come back soon.</p>
      </div>
    );
  }

  const result = simulation.data;
  const interestShare = result ? (Number(result.totalInterest) / Number(result.totalPayment)) * 100 : 0;

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start lg:gap-14">
      <section
        aria-label="Loan settings"
        className="space-y-10 border-2 border-ink bg-card p-6 sm:p-7 lg:sticky lg:top-24"
      >
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-ink">Loan type</legend>
          <div className="grid gap-px border border-ink/20 bg-ink/20">
            {list.map((item) => {
              const active = item.id === product.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setProductId(item.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors",
                    active ? "bg-brand text-brand-ink" : "bg-card hover:bg-paper-2",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={cn("size-3 border-2", active ? "border-brand-ink bg-brand-ink" : "border-ink/40")}
                      aria-hidden="true"
                    />
                    <span className="font-semibold">{item.name}</span>
                  </span>
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

      <section aria-label="Result" aria-live="polite" className="min-w-0 space-y-12">
        {simulation.error && !result ? (
          <div role="alert" className="border-l-4 border-negative bg-negative/10 p-6 font-medium text-negative">
            {simulation.error.message}
          </div>
        ) : (
          <>
            <div className="relative isolate overflow-hidden bg-brand p-8 text-brand-ink sm:p-12">
              <Guilloche className="absolute -top-40 -right-40 -z-10 size-[34rem] text-brand-ink/14" />
              <p className="text-base font-medium opacity-85">Your monthly payment</p>
              <p
                className={cn(
                  "font-display condensed mt-3 text-[clamp(4.5rem,12vw,9.5rem)] leading-[0.9] transition-opacity",
                  simulation.isPlaceholderData && "opacity-60",
                )}
              >
                {result ? formatTnd(result.monthlyPayment).replace(" TND", "") : "..."}
                {result && <span className="ml-3 text-[0.3em] font-semibold opacity-80">TND</span>}
              </p>
              {result && (
                <p className="mt-5 text-base opacity-85">
                  over {result.months} months at {Number(result.annualRate).toFixed(2)} % a year
                </p>
              )}
            </div>

            {result && (
              <>
                <div>
                  <dl className="grid divide-y divide-ink/15 border-y-2 border-ink sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    {[
                      ["Amount borrowed", formatTnd(result.amount)],
                      ["Total interest", formatTnd(result.totalInterest)],
                      ["Total to repay", formatTnd(result.totalPayment)],
                    ].map(([label, value]) => (
                      <div key={label} className="px-1 py-5 sm:px-6 sm:first:pl-0">
                        <dt className="text-sm text-ink-soft">{label}</dt>
                        <dd className="font-display mt-1.5 text-3xl">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-6 flex h-4 overflow-hidden" aria-hidden="true">
                    <div className="bg-brand" style={{ width: `${100 - interestShare}%` }} />
                    <div className="bg-ink" style={{ width: `${interestShare}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-sm text-ink-soft">
                    <span>Principal {(100 - interestShare).toFixed(1)} %</span>
                    <span className="font-semibold text-ink">Interest {interestShare.toFixed(1)} %</span>
                  </div>
                </div>

                <div className="border-l-4 border-brand bg-paper-2 p-6 text-base">
                  <p className="max-w-2xl leading-relaxed">
                    To stay within this product’s {fractionToPercent(result.product.maxDebtRatio)} % debt ratio, a monthly
                    income of about <strong className="whitespace-nowrap">{formatTnd(result.minimumIncome)}</strong> is
                    expected.
                  </p>
                  {status !== "authenticated" && (
                    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                      <ButtonLink href="/register">Open an account to apply</ButtonLink>
                      <span className="text-sm text-ink-soft">The simulation above is not saved anywhere.</span>
                    </div>
                  )}
                  {status === "authenticated" && user?.role === "CUSTOMER" && (
                    <div className="mt-5">
                      <ButtonLink
                        href={`/loans/apply?product=${product.id}&amount=${debouncedAmount}&months=${debouncedMonths}`}
                      >
                        Apply for this loan
                      </ButtonLink>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="font-display condensed text-4xl">Remaining balance</h2>
                  <div className="mt-4 border border-ink/20 bg-card p-4">
                    <BalanceChart schedule={result.schedule} amount={result.amount} />
                  </div>
                </div>

                <div>
                  <h2 className="font-display condensed mb-4 text-4xl">Repayment schedule</h2>
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
