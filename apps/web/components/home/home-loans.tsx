"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { formatTnd } from "@/lib/format";
import { usePublicProducts } from "@/lib/queries";
import { cn } from "@/lib/utils";

const COLS = "lg:grid-cols-[1.5fr_1fr_1fr_11rem]";

function Board() {
  const products = usePublicProducts();

  if (products.isLoading) {
    return (
      <div className="border-y-4 border-ink" aria-busy="true">
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className="h-32 animate-pulse border-b border-ink/15 bg-paper-2 last:border-b-0" />
        ))}
      </div>
    );
  }

  if (products.error || !products.data || products.data.length === 0) {
    return (
      <p className="border-y-4 border-ink py-12 text-center text-ink-soft">
        {products.error
          ? "The loan conditions are slow to load. The free API server may be waking up: refresh in a few seconds."
          : "No loan products are published right now."}
      </p>
    );
  }

  return (
    <div className="border-y-4 border-ink">
      <div className={cn("hidden gap-6 border-b border-ink/15 px-5 py-3 text-sm text-ink-soft lg:grid", COLS)}>
        <span>Product</span>
        <span>Amount</span>
        <span>Duration</span>
        <span className="text-right">Annual rate</span>
      </div>

      {products.data.map((product) => (
        <Link
          key={product.id}
          href={`/loans/simulator?product=${product.id}`}
          className={cn(
            "group grid items-center gap-x-6 gap-y-3 border-b border-ink/15 px-5 py-8 transition-colors last:border-b-0 hover:bg-brand hover:text-brand-ink",
            COLS,
          )}
        >
          <div>
            <h3 className="font-display condensed text-4xl leading-none sm:text-5xl">{product.name}</h3>
            {product.description && (
              <p className="mt-2 max-w-sm text-sm text-ink-soft transition-colors group-hover:text-brand-ink/80">
                {product.description}
              </p>
            )}
          </div>
          <p className="num text-sm">
            <span className="mr-2 font-sans text-ink-soft group-hover:text-brand-ink/75 lg:hidden">Amount</span>
            {formatTnd(product.minAmount).replace(" TND", "")} to {formatTnd(product.maxAmount)}
          </p>
          <p className="num text-sm">
            <span className="mr-2 font-sans text-ink-soft group-hover:text-brand-ink/75 lg:hidden">Duration</span>
            {product.minMonths} to {product.maxMonths} months
          </p>
          <p className="flex items-center justify-between gap-3 lg:justify-end">
            <span className="font-display condensed text-7xl leading-none">
              {Number(product.annualRate).toFixed(2)}
              <span className="ml-1 text-3xl opacity-60">%</span>
            </span>
            <ArrowUpRight className="size-6 shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
            <span className="sr-only">Simulate {product.name}</span>
          </p>
        </Link>
      ))}
    </div>
  );
}

export function HomeLoans() {
  return (
    <section id="rates" className="scroll-mt-16 bg-paper-2">
      <div className="mx-auto max-w-[84rem] px-6 py-24 lg:px-10 lg:py-32">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <h2 className="font-display condensed text-5xl leading-[0.92] text-ink sm:text-7xl">
              Today’s rates, straight from the back office.
            </h2>
            <p className="mt-6 max-w-lg text-lg text-ink-soft">
              Read live from the bank right now. Pick a row to see exactly what it would cost.
            </p>
          </div>
          <ButtonLink href="/loans/simulator" variant="outline" size="lg" className="shrink-0">
            Open the simulator
          </ButtonLink>
        </div>

        <div className="mt-14">
          <Board />
        </div>
      </div>
    </section>
  );
}
