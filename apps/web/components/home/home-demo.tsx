import { TransferConsole } from "./transfer-console";

export function HomeDemo() {
  return (
    <section id="demo" className="scroll-mt-16 bg-paper-2">
      <div className="mx-auto grid max-w-[84rem] items-center gap-14 px-6 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-10 lg:py-32">
        <div>
          <h2 className="font-display condensed text-5xl leading-[0.92] text-ink sm:text-7xl">
            Pull the plug in the middle of a transfer.
          </h2>
          <p className="mt-7 max-w-md text-lg leading-relaxed text-ink-soft">
            Every movement debits one account and credits another inside a single database transaction. Send some money,
            then crash the server halfway through and see what happens to the books.
          </p>
        </div>

        <TransferConsole />
      </div>
    </section>
  );
}
