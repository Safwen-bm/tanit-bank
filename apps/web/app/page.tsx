import { LandingProducts } from "@/components/landing/landing-products";
import { LedgerSheet } from "@/components/landing/ledger-sheet";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { ButtonLink } from "@/components/ui/button-link";

const PRINCIPLES = [
  {
    n: "01",
    title: "Counted twice, settled once.",
    text: "Every movement debits one account and credits another inside a single database transaction. It happens completely, or not at all.",
  },
  {
    n: "02",
    title: "Rates you can check.",
    text: "Loan conditions are published by the bank and used by the simulator and by real applications alike. Nobody gets a hidden rate.",
  },
  {
    n: "03",
    title: "Everything on the record.",
    text: "Logins, transfers, approvals and product changes each leave a line in the audit log, with who did what and when.",
  },
];

export default function Home() {
  return (
    <div className="ledger flex min-h-dvh flex-col">
      <div className="mosaic" />
      <PublicHeader />

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-16 px-6 pt-10 pb-24 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
          <div>
            <p className="num mb-5 text-xs tracking-[0.25em] text-accent uppercase">Retail banking, in plain sight</p>
            <h1 className="font-display text-5xl leading-[1.02] font-semibold tracking-tight sm:text-7xl">
              A bank that keeps its books <em className="font-normal text-brand">where you can read them.</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-soft">
              Open an account in a minute, move money instantly and borrow at rates the bank publishes openly. Try the
              loan simulator first, no account needed.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <ButtonLink href="/register">Open an account</ButtonLink>
              <ButtonLink href="/loans/simulator" variant="outline">
                Try the loan simulator
              </ButtonLink>
            </div>
          </div>
          <LedgerSheet />
        </section>

        <section className="border-y-2 border-ink bg-paper-2/60 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <p className="num text-xs tracking-[0.25em] text-accent uppercase">Loans</p>
              <h2 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
                Today&apos;s conditions, live.
              </h2>
              <p className="mt-3 text-ink-soft">
                These rates and limits are read from the bank&apos;s back office right now. Pick one and see exactly what
                it would cost.
              </p>
            </div>
            <div className="mt-10">
              <LandingProducts />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-12 md:grid-cols-3">
            {PRINCIPLES.map((item) => (
              <article key={item.n}>
                <p className="num text-4xl font-semibold text-accent">{item.n}</p>
                <h3 className="font-display mt-3 text-2xl font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-3 text-ink-soft">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="tiles relative mx-auto max-w-6xl overflow-hidden rounded-2xl border-2 border-ink bg-brand p-10 text-brand-ink shadow-[8px_8px_0_0_var(--ink)] sm:p-16">
            <h2 className="font-display max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Ready to see your money move?
            </h2>
            <p className="mt-4 max-w-xl opacity-80">
              Create a free customer account and explore accounts, transfers and loans with simulated money.
            </p>
            <div className="mt-8">
              <ButtonLink href="/register" variant="outline">
                Open an account
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}