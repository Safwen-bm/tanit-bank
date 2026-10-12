"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, type PointerEvent } from "react";

type Part = string | { mark: string };

const CLAUSES: { title: string; parts: Part[] }[] = [
  {
    title: "The rate",
    parts: [
      "Your loan carries one annual rate, published on this site and read from the bank’s back office. ",
      { mark: "The rate you see in the simulator is the rate you are offered." },
      " It does not change between simulation and application.",
    ],
  },
  {
    title: "The payment",
    parts: [
      "Your monthly payment is the same every month. It is worked out from the amount, the duration and the rate, and the full repayment schedule is shown before you apply.",
    ],
  },
  {
    title: "The fees",
    parts: ["There are ", { mark: "no hidden fees" }, ", no fees added later and no fees printed smaller than this sentence."],
  },
  {
    title: "The record",
    parts: ["Every login, transfer, approval and rate change is written to an audit log: who did what, and when."],
  },
  {
    title: "The money",
    parts: ["Tanit Bank is a portfolio project. ", { mark: "It is not a licensed bank" }, " and no real money moves."],
  },
];

/** Rendered twice, with identical layout: once as the page, once under the lens. */
function Text({ lens }: { lens?: boolean }) {
  return (
    <div className="px-7 py-8 text-[12px] leading-normal">
      <p className="font-semibold">Conditions of your Tanit Bank loan</p>
      {CLAUSES.map((clause, i) => (
        <p key={clause.title} className="mt-3.5">
          <span className="font-semibold">
            {i + 1}. {clause.title}.{" "}
          </span>
          {clause.parts.map((part, j) =>
            typeof part === "string" ? (
              part
            ) : (
              <mark key={j} className={lens ? "bg-brand text-brand-ink" : "bg-transparent text-inherit"}>
                {part.mark}
              </mark>
            ),
          )}
        </p>
      ))}
    </div>
  );
}

function place(el: HTMLElement, x: number, y: number) {
  el.style.setProperty("--lx", `${x}px`);
  el.style.setProperty("--ly", `${y}px`);
}

/**
 * A sheet of fine print with a magnifier on it. The lens drifts by itself and follows the pointer
 * as soon as there is one. Under the lens the same text is drawn 2.1 times larger, with the
 * promises highlighted.
 */
export function FinePrintSheet() {
  const box = useRef<HTMLDivElement>(null);
  const aim = useRef({ x: 0, y: 0, manual: false });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = box.current;
    if (!el) return;

    let x = el.offsetWidth * 0.5;
    let y = el.offsetHeight * 0.4;
    place(el, x, y);
    if (reduce) return;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const a = aim.current;
      const tx = a.manual ? a.x : el.offsetWidth * (0.5 + 0.28 * Math.sin(t * 0.5));
      const ty = a.manual ? a.y : el.offsetHeight * (0.46 + 0.32 * Math.sin(t * 0.33 + 1.2));
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      place(el, x, y);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  function onMove(event: PointerEvent<HTMLDivElement>) {
    const el = box.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (reduce) place(el, x, y);
    else aim.current = { x, y, manual: true };
  }

  return (
    <figure className="mx-auto w-full max-w-[30rem]">
      <div className="relative">
        <div aria-hidden="true" className="absolute inset-0 -rotate-3 bg-blush" />
        <div aria-hidden="true" className="absolute inset-0 rotate-[2.5deg] bg-paper-2" />

        <div
          ref={box}
          onPointerMove={onMove}
          onPointerLeave={() => (aim.current.manual = false)}
          className="relative min-h-[26rem] touch-pan-y cursor-zoom-in bg-card text-ink/75 [--lr:4.75rem] sm:[--lr:6rem]"
        >
          <Text />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden bg-card text-ink"
            style={{ clipPath: "circle(var(--lr) at var(--lx) var(--ly))" }}
          >
            <div className="absolute inset-0 scale-[2.1]" style={{ transformOrigin: "var(--lx) var(--ly)" }}>
              <Text lens />
            </div>
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-10"
            style={{
              left: "var(--lx)",
              top: "var(--ly)",
              width: "calc(var(--lr) * 2)",
              height: "calc(var(--lr) * 2)",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="absolute top-[85%] left-[85%] -ml-2 h-28 w-4 origin-top -rotate-45 rounded-[2px] bg-deep" />
            <div className="size-full rounded-full border-[6px] border-deep shadow-[inset_0_0_0_2px_rgb(255_255_255/0.5),0_18px_30px_-8px_rgb(0_0_0/0.35)]" />
          </div>
        </div>
      </div>
      <figcaption className="mt-8 text-sm text-brand-ink/85">Move over the sheet to read it larger.</figcaption>
    </figure>
  );
}
