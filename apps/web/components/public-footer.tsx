import { ArrowUpRight, Globe } from "lucide-react";
import Link from "next/link";
import { TanitLogo } from "./tanit-logo";

const GITHUB = "https://github.com/Safwen-bm";
const LINKEDIN = "https://linkedin.com/in/safwen-ben-mabrouk";
const PORTFOLIO = "https://safwen-portfolio.vercel.app/";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

const BANK_LINKS = [
  { href: "/register", label: "Open an account" },
  { href: "/login", label: "Sign in" },
  { href: "/loans/simulator", label: "Loan simulator" },
];

const EXPLORE_LINKS = [
  { href: "/#features", label: "Services" },
  { href: "/#transparency", label: "On the record" },
  { href: "/#rates", label: "Live rates" },
];

const SOCIALS = [
  { href: GITHUB, label: "GitHub", icon: GithubIcon },
  { href: LINKEDIN, label: "LinkedIn", icon: LinkedinIcon },
  { href: PORTFOLIO, label: "Portfolio", icon: Globe },
];

function Column({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-sm font-semibold opacity-60">{title}</p>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-lg font-medium underline-offset-4 decoration-2 hover:underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-brand text-brand-ink">
      <div className="mx-auto max-w-[84rem] px-6 pt-20 lg:px-10">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          <div>
            <TanitLogo onBrand />
            <p className="mt-6 max-w-xs text-lg leading-snug font-medium">
              A transparent retail bank, built end to end. Simulated money, real engineering.
            </p>
          </div>

          <Column title="Bank" links={BANK_LINKS} />
          <Column title="Explore" links={EXPLORE_LINKS} />

          <div>
            <p className="text-sm font-semibold opacity-60">Built by</p>
            <p className="font-display mt-4 text-3xl leading-none">Safwen Ben Mabrouk</p>
            <p className="mt-2 text-sm opacity-75">Software engineer</p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-3">
              {SOCIALS.map(({ href, label, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 text-sm font-semibold"
                  >
                    <span className="grid size-9 place-items-center rounded-[3px] border border-brand-ink/40 transition-colors group-hover:bg-brand-ink group-hover:text-brand">
                      <Icon className="size-4" />
                    </span>
                    <span className="sr-only sm:not-sr-only">{label}</span>
                    <ArrowUpRight className="hidden size-3.5 opacity-0 transition-opacity group-hover:opacity-100 sm:block" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-brand-ink/25 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Tanit Bank. All rights reserved.</p>
          <p className="opacity-75">Portfolio project. Not a licensed bank. No real money, no real loans.</p>
        </div>

        <div aria-hidden="true" className="relative mt-10 h-[clamp(2.5rem,11.5vw,11rem)] overflow-hidden">
          <p className="font-display condensed absolute inset-x-0 top-0 text-center text-[clamp(4rem,19vw,18rem)] leading-[0.8] font-extrabold whitespace-nowrap text-deep select-none">
            Tanit Bank
          </p>
        </div>
      </div>
    </footer>
  );
}
