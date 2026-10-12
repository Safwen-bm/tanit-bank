import type { Metadata } from "next";
import { Suspense } from "react";
import { LoanSimulator } from "@/components/loans/simulator";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { Guilloche } from "@/components/ui/guilloche";
import { Photo } from "@/components/ui/photo";

export const metadata: Metadata = {
  title: "Loan simulator",
  description: "Estimate a loan with the bank's current rates and limits. No account needed, nothing is stored.",
};

export default function SimulatorPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <PublicHeader />

      <section className="bg-deep text-deep-ink">
        <div className="mx-auto grid max-w-[84rem] items-center gap-12 px-6 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-10">
          <div>
            <h1 className="font-display condensed text-[clamp(3.6rem,8vw,7.5rem)] leading-[0.88]">
              What would it cost you?
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-deep-ink/75">
              Rates and limits come straight from the bank’s current loan products, so what you see is what a real
              application would use. No account needed, and nothing you enter is saved.
            </p>
          </div>

          <Photo
            src="/images/simulator.jpg"
            alt="An architect’s desk with a small wooden house model, a ruler and a ring of keys"
            dark
            eager
            sizes="(min-width: 1024px) 40vw, 90vw"
            className="aspect-[3/2] w-full"
            fallback={<Guilloche className="size-[140%] text-hot/25" />}
          />
        </div>
      </section>

      <main className="mx-auto w-full max-w-[84rem] flex-1 px-6 pt-14 pb-28 lg:px-10">
        <Suspense>
          <LoanSimulator />
        </Suspense>
      </main>

      <PublicFooter />
    </div>
  );
}
