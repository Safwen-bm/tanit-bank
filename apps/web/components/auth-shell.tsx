import type { ReactNode } from "react";
import { TanitMark } from "./tanit-mark";
import { ThemeSwitcher } from "./theme-switcher";

const PROMISES = [
  ["01", "Transfers settle atomically, or not at all."],
  ["02", "Loan rates are set by the bank, never by the browser."],
  ["03", "Every sensitive action leaves a line in the audit log."],
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="tiles relative hidden flex-col justify-between overflow-hidden bg-brand p-12 text-brand-ink lg:flex">
        <div className="flex items-center gap-3">
          <TanitMark className="size-8" />
          <span className="font-display text-2xl font-semibold tracking-tight">Tanit Bank</span>
        </div>

        <div>
          <h2 className="font-display max-w-md text-6xl leading-[1.02] font-semibold tracking-tight">
            Every dinar, accounted for.
          </h2>
          <ul className="mt-10 max-w-sm space-y-4">
            {PROMISES.map(([n, text]) => (
              <li key={n} className="flex gap-4 text-sm leading-relaxed text-brand-ink/80">
                <span className="num text-brand-ink">{n}</span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="num text-xs tracking-wide text-brand-ink/60">
          Portfolio project. Not a licensed bank. No real money.
        </p>
      </aside>

      <main className="ledger flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 sm:px-10">
          <div className="flex items-center gap-2 text-brand lg:invisible">
            <TanitMark className="size-6" />
            <span className="font-display text-lg font-semibold">Tanit Bank</span>
          </div>
          <ThemeSwitcher compact />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-16 sm:px-0">
          <h1 className="font-display text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-ink-soft">{subtitle}</p>
          <div className="mt-10">{children}</div>
          <div className="mt-8 text-sm text-ink-soft">{footer}</div>
        </div>
      </main>
    </div>
  );
}