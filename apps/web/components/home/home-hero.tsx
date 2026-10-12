"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Guilloche } from "@/components/ui/guilloche";
import { usePublicProducts } from "@/lib/queries";
import { FinePrintSheet } from "./fine-print-sheet";

/** Today's rates, read live from the bank's own products. */
function RateStrip() {
  const products = usePublicProducts();
  const items = products.data ?? [];

  return (
    <div className="bg-deep text-deep-ink">
      <div className="mx-auto flex max-w-[84rem] items-stretch overflow-x-auto px-6 lg:px-10">
        <p className="flex shrink-0 items-center gap-3 py-5 pr-8 text-sm font-medium text-deep-ink/70">
          <span className="size-2 bg-hot" aria-hidden="true" />
          Today’s rates
        </p>

        {products.isLoading &&
          [0, 1, 2].map((n) => (
            <div key={n} className="flex shrink-0 items-center border-l border-deep-ink/15 px-6 py-5">
              <span className="h-6 w-36 animate-pulse bg-deep-ink/10" />
            </div>
          ))}

        {items.map((product) => (
          <Link
            key={product.id}
            href={`/loans/simulator?product=${product.id}`}
            className="group flex shrink-0 items-baseline gap-3 border-l border-deep-ink/15 px-6 py-4 transition-colors hover:bg-deep-ink/8"
          >
            <span className="text-sm text-deep-ink/70">{product.name}</span>
            <span className="font-display text-3xl">
              {Number(product.annualRate).toFixed(2)}
              <span className="ml-0.5 text-lg text-deep-ink/60">%</span>
            </span>
          </Link>
        ))}

        {!products.isLoading && items.length === 0 && (
          <p className="flex items-center border-l border-deep-ink/15 px-6 py-5 text-sm text-deep-ink/60">
            The API server may be waking up. Refresh in a few seconds.
          </p>
        )}
      </div>
    </div>
  );
}

export function HomeHero() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-brand text-brand-ink">
        <Guilloche className="absolute -right-56 -bottom-80 -z-10 size-[64rem] text-brand-ink/14" />

        <div className="mx-auto grid max-w-[84rem] items-center gap-16 px-6 py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10 lg:px-10 lg:py-24">
          <div>
            <h1 className="font-display condensed text-[clamp(4.4rem,9vw,8.75rem)] leading-[0.9] font-extrabold tracking-[-0.012em] text-balance">
              Fine print,
              <br />
              printed large.
            </h1>

            <p className="mt-9 max-w-md text-lg leading-relaxed text-brand-ink/90">
              Tanit Bank publishes every rate and rule in plain sight. Open an account in a minute, simulate a loan at
              the real rate, and watch each transfer settle completely or not at all.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/register" variant="inverse" size="lg">
                Open an account
              </ButtonLink>
              <ButtonLink href="/loans/simulator" variant="inverse-outline" size="lg">
                Try the loan simulator
              </ButtonLink>
            </div>
          </div>

          <FinePrintSheet />
        </div>
      </section>

      <RateStrip />
    </>
  );
}
