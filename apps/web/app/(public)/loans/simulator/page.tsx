import type { Metadata } from "next";
import { Suspense } from "react";
import { LoanSimulator } from "@/components/loans/simulator";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";

export const metadata: Metadata = {
  title: "Loan simulator",
  description: "Estimate a loan with the bank's current rates and limits. No account needed, nothing is stored.",
};

export default function SimulatorPage() {
  return (
    <div className="ledger flex min-h-dvh flex-col">
      <div className="mosaic" />
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-6 pb-20">
        <header className="mb-10 max-w-2xl">
          <p className="num text-xs tracking-[0.25em] text-accent uppercase">Loan simulator</p>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-6xl">
            What would it cost you?
          </h1>
          <p className="mt-4 text-lg text-ink-soft">
            Rates and limits come straight from the bank&apos;s current loan products, so what you see is what a real
            application would use. No account needed.
          </p>
        </header>
        <Suspense>
          <LoanSimulator />
        </Suspense>
      </main>
      <PublicFooter />
    </div>
  );
}