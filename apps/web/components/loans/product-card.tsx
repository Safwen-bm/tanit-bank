import { formatTnd } from "@/lib/format";
import { fractionToPercent } from "@/lib/money";
import type { LoanProduct } from "@/lib/types";

export function ProductRate({ rate }: { rate: string }) {
  return (
    <p className="num text-5xl font-semibold tracking-tight">
      {Number(rate).toFixed(2)}
      <span className="ml-1 text-xl text-ink-soft">%</span>
    </p>
  );
}

export function ProductFacts({ product }: { product: LoanProduct }) {
  return (
    <dl className="mt-5 space-y-2 border-t-2 border-dashed border-rule pt-4 text-sm">
      <div className="flex justify-between gap-3">
        <dt className="text-ink-soft">Amount</dt>
        <dd className="num text-right">
          {formatTnd(product.minAmount).replace(" TND", "")} to {formatTnd(product.maxAmount)}
        </dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-ink-soft">Duration</dt>
        <dd className="num text-right">
          {product.minMonths} to {product.maxMonths} months
        </dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-ink-soft">Max. debt ratio</dt>
        <dd className="num text-right">{fractionToPercent(product.maxDebtRatio)} %</dd>
      </div>
    </dl>
  );
}