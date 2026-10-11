"use client";

import { TanitMark } from "@/components/tanit-mark";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="ledger flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <TanitMark className="size-12 text-negative" />
      <p className="num text-xs tracking-[0.3em] text-negative uppercase">Something went wrong</p>
      <h1 className="font-display max-w-xl text-5xl font-semibold tracking-tight sm:text-6xl">
        The ledger hit a snag.
      </h1>
      <p className="max-w-md text-ink-soft">
        Nothing was lost: every money movement either completes fully or not at all. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}