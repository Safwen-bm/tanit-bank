"use client";

import Link from "next/link";
import { ProductFacts, ProductRate } from "@/components/loans/product-card";
import { usePublicProducts } from "@/lib/queries";

export function LandingProducts() {
  const products = usePublicProducts();

  if (products.isLoading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className="h-64 animate-pulse rounded-xl border-2 border-rule bg-card" />
        ))}
      </div>
    );
  }

  if (products.error || !products.data || products.data.length === 0) {
    return (
      <p className="rounded-xl border-2 border-dashed border-rule p-8 text-center text-ink-soft">
        {products.error
          ? "The loan conditions are slow to load. The free API server may be waking up: refresh in a few seconds."
          : "No loan products are published right now."}
      </p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {products.data.map((product) => (
        <Link
          key={product.id}
          href={`/loans/simulator?product=${product.id}`}
          className="group flex flex-col rounded-xl border-2 border-ink bg-card p-6 shadow-[4px_4px_0_0_var(--ink)] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0_0_var(--ink)]"
        >
          <p className="num text-[11px] tracking-[0.18em] text-ink-soft uppercase">From</p>
          <ProductRate rate={product.annualRate} />
          <h3 className="font-display mt-3 text-xl font-semibold">{product.name}</h3>
          {product.description && <p className="mt-1 text-sm text-ink-soft">{product.description}</p>}
          <div className="mt-auto">
            <ProductFacts product={product} />
            <p className="mt-4 text-sm font-semibold text-brand underline-offset-4 group-hover:underline">
              Simulate this loan
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}