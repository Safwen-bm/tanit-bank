import { TanitMark } from "./tanit-mark";

export function PublicFooter() {
  return (
    <footer className="border-t-2 border-ink bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 text-brand">
          <TanitMark className="size-5" />
          <span className="font-display font-semibold">Tanit Bank</span>
        </div>
        <p className="num text-xs leading-relaxed text-ink-soft">
          Portfolio project by Safwen. Not a licensed bank. No real money, no real loans.
        </p>
      </div>
    </footer>
  );
}