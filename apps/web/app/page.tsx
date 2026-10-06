import { ApiStatus } from "@/components/api-status";
import { TanitMark } from "@/components/tanit-mark";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function Home() {
  return (
    <main className="ledger flex min-h-dvh flex-col">
      <div className="mosaic" />
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5 text-brand">
          <TanitMark className="size-7" />
          <span className="font-display text-xl font-semibold tracking-tight">Tanit Bank</span>
        </div>
        <ThemeSwitcher />
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 px-6 pb-24">
        <div className="max-w-2xl">
          <p className="num mb-4 text-xs uppercase tracking-[0.25em] text-accent">
            Phase 0 · foundations
          </p>
          <h1 className="font-display text-5xl leading-[1.05] font-semibold tracking-tight sm:text-7xl">
            A bank that keeps its books{" "}
            <em className="font-normal text-brand">in plain sight.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-soft">
            Accounts, transfers and loans, built like a ledger. This page is a temporary
            checkpoint: the real landing page arrives with the public simulator.
          </p>
        </div>
        <div className="max-w-md">
          <ApiStatus />
        </div>
      </section>
    </main>
  );
}