"use client";

import { TanitLogo } from "@/components/tanit-logo";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col justify-between bg-deep px-6 py-10 text-deep-ink lg:px-10">
      <TanitLogo inverted />

      <div>
        <p
          aria-hidden="true"
          className="font-display condensed text-[clamp(7rem,28vw,24rem)] leading-[0.8] font-extrabold tracking-normal text-hot"
        >
          Oops
        </p>
        <h1 className="font-display condensed mt-8 text-4xl sm:text-6xl">The ledger hit a snag.</h1>
        <p className="mt-4 max-w-md text-lg text-deep-ink/70">
          Nothing was lost: every money movement either completes fully or not at all. Please try again.
        </p>
        <div className="mt-9">
          <Button onClick={reset} variant="inverse" size="lg">
            Try again
          </Button>
        </div>
      </div>
    </main>
  );
}
