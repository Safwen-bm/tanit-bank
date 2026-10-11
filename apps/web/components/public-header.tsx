"use client";

import Link from "next/link";
import { homeFor } from "@/lib/routes";
import { useAuth } from "./auth-provider";
import { TanitMark } from "./tanit-mark";
import { ThemeSwitcher } from "./theme-switcher";
import { ButtonLink } from "./ui/button-link";

export function PublicHeader() {
  const { user, status } = useAuth();

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5">
      <Link href="/" className="flex items-center gap-2.5 text-brand">
        <TanitMark className="size-7" />
        <span className="font-display text-xl font-semibold tracking-tight">Tanit Bank</span>
      </Link>

      <nav className="flex items-center gap-2 sm:gap-4" aria-label="Main">
        <Link href="/loans/simulator" className="hidden px-2 text-sm font-medium text-ink-soft hover:text-ink sm:block">
          Loan simulator
        </Link>
        <ThemeSwitcher compact />
        {status === "authenticated" && user ? (
          <ButtonLink href={homeFor(user.role)} size="sm">
            Open dashboard
          </ButtonLink>
        ) : (
          <>
            <ButtonLink href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
              Sign in
            </ButtonLink>
            <ButtonLink href="/register" size="sm">
              Open an account
            </ButtonLink>
          </>
        )}
      </nav>
    </header>
  );
}