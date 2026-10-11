"use client";

import { LoanCard } from "@/components/loans/loan-card";
import { ButtonLink } from "@/components/ui/button-link";
import { useMyLoans } from "@/lib/queries";

export default function LoansPage() {
  const loans = useMyLoans();

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="num text-xs tracking-[0.25em] text-accent uppercase">Loans</p>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Your loans.</h1>
          <p className="mt-3 max-w-xl text-ink-soft">
            Applications, decisions and repayments in one place. Rates are locked in when you apply.
          </p>
        </div>
        <div className="flex gap-3">
          <ButtonLink href="/loans/simulator" variant="outline">
            Simulate
          </ButtonLink>
          <ButtonLink href="/loans/apply">Apply for a loan</ButtonLink>
        </div>
      </header>

      {loans.isLoading ? (
        <p className="text-ink-soft">Loading...</p>
      ) : loans.data && loans.data.length > 0 ? (
        <div className="space-y-5">
          {loans.data.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-rule p-10 text-center">
          <p className="font-display text-xl">No loans yet.</p>
          <p className="mt-2 text-sm text-ink-soft">Try the simulator to see what a loan would cost, then apply.</p>
        </div>
      )}
    </div>
  );
}