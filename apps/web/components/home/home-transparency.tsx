import { Photo } from "@/components/ui/photo";

const LOG = [
  ["09:41", "Login", "customer"],
  ["09:42", "Transfer settled", "customer"],
  ["09:57", "Loan approved", "admin"],
  ["10:03", "Rate updated", "admin"],
] as const;

export function HomeTransparency() {
  return (
    <section id="transparency" className="scroll-mt-16 border-t border-ink/15 bg-paper">
      <div className="mx-auto grid max-w-[84rem] gap-14 px-6 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-10 lg:py-32">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="font-display condensed text-5xl leading-[0.92] text-ink sm:text-7xl">
            A bank should show its work.
          </h2>
          <figure className="mt-10">
            <Photo
              src="/images/magnifier.jpg"
              alt="A brass magnifying glass enlarging the small print of a loan agreement"
              sizes="(min-width: 1024px) 32vw, 90vw"
              className="aspect-[4/5] w-full"
            />
            <figcaption className="mt-3 text-sm text-ink-soft">The fine print, enlarged.</figcaption>
          </figure>
        </div>

        <div className="divide-y divide-ink/15 border-y border-ink/15">
          <div className="py-12 first:pt-10">
            <h3 className="font-display condensed text-4xl leading-[0.95] text-ink sm:text-6xl">Rates you can check.</h3>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              Loan conditions are published by the bank and used by the simulator and by real applications alike. Nobody
              gets a hidden rate.
            </p>
          </div>

          <div className="py-12">
            <h3 className="font-display condensed text-4xl leading-[0.95] text-ink sm:text-6xl">
              Everything on the record.
            </h3>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              Logins, transfers, approvals and product changes each leave a line in the audit log, with who did what and
              when.
            </p>
            <div aria-hidden="true" className="num mt-8 max-w-xl bg-deep text-xs text-deep-ink">
              {LOG.map(([time, event, actor]) => (
                <div key={time} className="flex items-center gap-4 border-b border-deep-ink/10 px-4 py-3 last:border-b-0">
                  <span className="text-deep-ink/55">{time}</span>
                  <span className="flex-1 font-sans text-sm font-medium">{event}</span>
                  <span className="text-hot">{actor}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="py-12 pb-10">
            <h3 className="font-display condensed text-4xl leading-[0.95] text-ink sm:text-6xl">Locked by the server.</h3>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              Customers and admins are separated by the API, not by the browser. Editing a cookie by hand unlocks
              nothing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
