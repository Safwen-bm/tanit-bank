"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ApplyForm } from "@/components/loans/apply-form";

export default function ApplyPage() {
  return (
    <div className="space-y-10">
      <Link href="/loans" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Loans
      </Link>
      <header>
        <p className="num text-xs tracking-[0.25em] text-accent uppercase">New application</p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Apply for a loan.</h1>
      </header>
      <Suspense>
        <ApplyForm />
      </Suspense>
    </div>
  );
}