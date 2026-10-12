import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { Guilloche } from "@/components/ui/guilloche";
import { TanitMark } from "@/components/tanit-mark";
import { cn } from "@/lib/utils";

const ACCOUNTS = [
  ["Current account", "2 500.000"],
  ["Savings account", "8 200.000"],
] as const;

const ACTIVITY = [
  ["Salary, October", "+ 2 500.000", true],
  ["Rent", "− 800.000", false],
  ["Groceries", "− 142.350", false],
] as const;

function AccountsPanel() {
  return (
    <div className="bg-card text-ink shadow-xl shadow-ink/10">
      <div className="grid gap-px bg-rule sm:grid-cols-2">
        {ACCOUNTS.map(([name, balance]) => (
          <div key={name} className="bg-card p-5">
            <p className="text-sm text-ink-soft">{name}</p>
            <p className="font-display mt-2 text-4xl">
              {balance} <span className="text-base font-semibold text-ink-soft">TND</span>
            </p>
          </div>
        ))}
      </div>
      <ul className="divide-y divide-rule border-t border-rule">
        {ACTIVITY.map(([label, amount, positive]) => (
          <li key={label} className="flex items-center justify-between px-5 py-3.5 text-sm">
            <span>{label}</span>
            <span className={cn("num", positive ? "font-semibold text-positive" : "text-ink")}>{amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const RECEIPT = [
  ["From", "Current account"],
  ["To", "Savings account"],
  ["Entries", "1 debit, 1 credit"],
  ["Reference", "TX-0001"],
] as const;

function TransfersPanel() {
  return (
    <div className="mx-auto max-w-sm bg-paper p-6 text-ink">
      <div className="flex items-center gap-2 text-positive">
        <Check className="size-4" strokeWidth={3} />
        <span className="text-sm font-semibold">Transfer settled</span>
      </div>
      <p className="font-display mt-4 text-6xl">
        60.000 <span className="text-lg font-semibold text-ink-soft">TND</span>
      </p>
      <dl className="num mt-6 divide-y divide-rule border-y border-rule text-xs">
        {RECEIPT.map(([key, value]) => (
          <div key={key} className="flex justify-between py-3">
            <dt className="text-ink-soft">{key}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function CardsPanel() {
  return (
    <div className="relative mx-auto h-[22rem] w-full max-w-md">
      <div className="absolute top-2 left-0 flex aspect-[1.586] w-[78%] -rotate-6 flex-col justify-between bg-deep p-5 text-deep-ink shadow-2xl shadow-black/30">
        <TanitMark className="size-7 text-gold" />
        <p className="num text-sm tracking-[0.2em] text-deep-ink/70">•••• •••• •••• 7731</p>
      </div>

      <div className="absolute right-0 bottom-0 flex aspect-[1.586] w-[84%] rotate-3 flex-col justify-between overflow-hidden bg-card p-5 text-ink shadow-2xl shadow-black/30">
        <Guilloche className="absolute -right-24 -bottom-28 size-80 text-brand/20" curves={8} points={400} />
        <div className="relative flex items-center justify-between">
          <TanitMark className="size-8 text-brand" />
          <span className="text-xs font-semibold text-ink-soft">Debit</span>
        </div>
        <p className="num relative text-xl tracking-[0.2em]">•••• •••• •••• 0142</p>
        <div className="relative flex items-end justify-between">
          <span className="text-xs text-ink-soft">Card holder</span>
          <span className="font-display text-xl">Tanit Bank</span>
        </div>
      </div>
    </div>
  );
}

const LOAN = [
  ["Amount", "10 000.000 TND"],
  ["Term", "36 months"],
  ["Annual rate", "7.900 %"],
  ["Monthly payment", "≈ 313 TND"],
] as const;

function LoansPanel() {
  return (
    <div className="bg-paper p-6 text-ink">
      <p className="text-sm text-ink-soft">Sample figures. See the live rates further down.</p>
      <dl className="num mt-4 divide-y divide-rule border-y border-rule text-sm">
        {LOAN.map(([key, value]) => (
          <div key={key} className="flex justify-between py-3">
            <dt className="text-ink-soft">{key}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex h-3 overflow-hidden">
        <div className="bg-brand" style={{ width: "89%" }} />
        <div className="bg-accent" style={{ width: "11%" }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-ink-soft">
        <span>Principal</span>
        <span>Interest</span>
      </div>
    </div>
  );
}

type Service = {
  title: string;
  tag: string;
  headline: string;
  text: string;
  tone: string;
  panel: ReactNode;
  action?: ReactNode;
};

const SERVICES: Service[] = [
  {
    title: "Accounts",
    tag: "Current and savings",
    headline: "Opened in a minute, exact to the millime.",
    text: "Balances are kept as exact decimals, never floating point, so what you see is what you have.",
    tone: "bg-blush text-ink",
    panel: <AccountsPanel />,
  },
  {
    title: "Transfers",
    tag: "All or nothing",
    headline: "One debit, one credit, one transaction.",
    text: "Move money between your accounts instantly. If anything goes wrong halfway, nothing moves at all.",
    tone: "bg-deep text-deep-ink",
    panel: <TransfersPanel />,
  },
  {
    title: "Cards",
    tag: "In your dashboard",
    headline: "Every card in one place.",
    text: "Keep your cards together and stay in control of them straight from the dashboard.",
    tone: "bg-brand text-brand-ink",
    panel: <CardsPanel />,
  },
  {
    title: "Loans",
    tag: "Published rates",
    headline: "Simulate it, then apply at the same rate.",
    text: "Browse the bank’s published products, work out the repayment plan, then apply. The rate does not change on the way.",
    tone: "bg-card text-ink border border-ink/15",
    panel: <LoansPanel />,
    action: (
      <ButtonLink href="/loans/simulator" variant="outline" className="mt-8">
        Open the simulator
      </ButtonLink>
    ),
  },
];

export function HomeProducts() {
  return (
    <section id="features" className="scroll-mt-16 bg-paper">
      <div className="mx-auto max-w-[84rem] px-6 pt-24 pb-24 lg:px-10 lg:pt-32 lg:pb-36">
        <h2 className="font-display condensed max-w-3xl text-5xl leading-[0.92] text-ink sm:text-7xl">
          Four things. Done properly.
        </h2>
        <p className="mt-6 max-w-lg text-lg text-ink-soft">That is the whole bank. Each one is shown here as it looks inside the app.</p>

        <div className="mt-14 lg:mt-20">
          {SERVICES.map((service, i) => (
            <article
              key={service.title}
              className={cn("relative mb-5 lg:sticky lg:mb-8", service.tone)}
              style={{ top: `calc(5rem + ${i * 3.5}rem)` }}
            >
              <header className="flex h-14 items-center justify-between gap-4 border-b border-current/20 px-6 sm:px-10">
                <h3 className="font-display text-3xl">{service.title}</h3>
                <p className="text-sm text-current/70">{service.tag}</p>
              </header>

              <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
                <div>
                  <p className="font-display condensed text-4xl leading-[0.98] sm:text-5xl">{service.headline}</p>
                  <p className="mt-5 max-w-md text-lg leading-relaxed text-current/80">{service.text}</p>
                  {service.action}
                </div>
                <div>{service.panel}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
