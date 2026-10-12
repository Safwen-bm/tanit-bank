import { cn } from "@/lib/utils";

/**
 * Guilloche: the engraved rosette printed on banknotes and cheques.
 * It is generated from a hypotrochoid, so there is no image to load.
 * Colour it with `text-*` : the lines use currentColor.
 */
const cache = new Map<string, string[]>();

function rosette(k: number, curves: number, points: number) {
  const key = `${k}-${curves}-${points}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const radius = 292;
  const out: string[] = [];
  for (let c = 0; c < curves; c++) {
    const loop = 24 + ((196 - 24) * c) / Math.max(1, curves - 1);
    let path = "";
    for (let j = 0; j <= points; j++) {
      const t = (2 * Math.PI * j) / points;
      const x = 500 + radius * Math.cos(t) + loop * Math.cos(k * t);
      const y = 500 + radius * Math.sin(t) - loop * Math.sin(k * t);
      path += `${j === 0 ? "M" : " "}${Math.round(x)},${Math.round(y)}`;
    }
    out.push(`${path}Z`);
  }
  cache.set(key, out);
  return out;
}

export function Guilloche({
  className,
  k = 12,
  curves = 10,
  points = 520,
}: {
  className?: string;
  k?: number;
  curves?: number;
  points?: number;
}) {
  return (
    <svg
      viewBox="0 0 1000 1000"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {rosette(k, curves, points).map((d, i) => (
        <path key={i} d={d} vectorEffect="non-scaling-stroke" />
      ))}
      <circle cx={500} cy={500} r={496} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
