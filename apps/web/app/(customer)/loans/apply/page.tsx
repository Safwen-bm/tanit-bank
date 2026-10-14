"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ApplyForm } from "@/components/loans/apply-form";
import { PageHeader } from "@/components/ui/page-header";

export default function ApplyPage() {
  return (
    <div className="space-y-12">
      <Link href="/loans" className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Loans
      </Link>
      <PageHeader title="Apply for a loan." />
      <Suspense>
        <ApplyForm />
      </Suspense>
    </div>
  );
}
