"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { homeFor } from "@/lib/routes";
import { useAuth } from "./auth-provider";
import { TanitLogo } from "./tanit-logo";
import { ThemeSwitcher } from "./theme-switcher";
import { ButtonLink } from "./ui/button-link";

const LINKS = [
  { href: "/#features", label: "Services" },
  { href: "/#transparency", label: "On the record" },
  { href: "/#rates", label: "Rates" },
  { href: "/loans/simulator", label: "Simulator" },
];

export function PublicHeader() {
  const { user, status } = useAuth();
  const [open, setOpen] = useState(false);
  const authed = status === "authenticated" && user;

  return (
    <header className="sticky top-0 z-50 border-b border-ink/15 bg-paper">
      <div className="mx-auto flex h-16 max-w-[84rem] items-center justify-between gap-6 px-6 lg:px-10">
        <Link href="/" aria-label="Tanit Bank, home" onClick={() => setOpen(false)}>
          <TanitLogo />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative py-1 text-sm font-medium text-ink after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-brand after:transition-transform hover:after:scale-x-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <div className="hidden md:block">
            <ThemeSwitcher compact />
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            {authed ? (
              <ButtonLink href={homeFor(user.role)} size="sm">
                Open dashboard
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="ghost" size="sm">
                  Sign in
                </ButtonLink>
                <ButtonLink href="/register" size="sm">
                  Open an account
                </ButtonLink>
              </>
            )}
          </div>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 cursor-pointer place-items-center text-ink lg:hidden"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-paper px-6 pt-4 pb-10 lg:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-display condensed border-b border-ink/15 py-4 text-5xl text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8 flex flex-col gap-3">
            {authed ? (
              <ButtonLink href={homeFor(user.role)} size="lg" onClick={() => setOpen(false)}>
                Open dashboard
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/register" size="lg" onClick={() => setOpen(false)}>
                  Open an account
                </ButtonLink>
                <ButtonLink href="/login" variant="outline" size="lg" onClick={() => setOpen(false)}>
                  Sign in
                </ButtonLink>
              </>
            )}
          </div>
          <div className="mt-8">
            <ThemeSwitcher />
          </div>
        </div>
      )}
    </header>
  );
}
