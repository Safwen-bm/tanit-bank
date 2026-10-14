"use client";

import { LoanCard } from "@/components/loans/loan-card";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { useMyLoans } from "@/lib/queries";

export default function LoansPage() {
  const loans = useMyLoans();

  return (
    <div className="space-y-12">
      <PageHeader
        title="Your loans."
        action={
          <div className="flex gap-3">
            <ButtonLink href="/loans/simulator" variant="outline">
              Simulate
            </ButtonLink>
            <ButtonLink href="/loans/apply">Apply for a loan</ButtonLink>
          </div>
        }
      >
        Applications, decisions and repayments in one place. Rates are locked in when you apply.
      </PageHeader>

      {loans.isLoading ? (
        <p className="text-ink-soft">Loading...</p>
      ) : loans.data && loans.data.length > 0 ? (
        <div className="space-y-5">
          {loans.data.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-ink/25 p-12 text-center">
          <p className="font-display condensed text-4xl">No loans yet.</p>
          <p className="mx-auto mt-3 max-w-sm text-ink-soft">
            Try the simulator to see what a loan would cost, then apply.
          </p>
          <ButtonLink href="/loans/simulator" className="mt-6">
            Open the simulator
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
