// Exact money arithmetic on strings, in millimes (1 TND = 1000 millimes). No floats.

export function toMillimes(value: string): bigint {
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace("-", "").split(".");
  const millimes = BigInt(whole + fraction.padEnd(3, "0").slice(0, 3));
  return negative ? -millimes : millimes;
}

export function fromMillimes(value: bigint): string {
  const negative = value < BigInt(0);
  const digits = (negative ? -value : value).toString().padStart(4, "0");
  return `${negative ? "-" : ""}${digits.slice(0, -3)}.${digits.slice(-3)}`;
}

export function sumMoney(values: string[]): string {
  return fromMillimes(values.reduce((total, value) => total + toMillimes(value), BigInt(0)));
}


// ───────────── Generic fixed-point helpers (percent <-> fraction without floats) ─────────────

function toUnits(value: string, decimals: number): bigint {
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace("-", "").split(".");
  const units = BigInt((whole || "0") + fraction.padEnd(decimals, "0").slice(0, decimals));
  return negative ? -units : units;
}

function fromUnits(value: bigint, decimals: number): string {
  const negative = value < BigInt(0);
  const digits = (negative ? -value : value).toString().padStart(decimals + 1, "0");
  return `${negative ? "-" : ""}${digits.slice(0, -decimals)}.${digits.slice(-decimals)}`;
}

/** "40.00" -> "40", "37.50" -> "37.5", "9.5000" -> "9.5" */
export function trimZeros(value: string): string {
  return value.includes(".") ? value.replace(/\.?0+$/, "") : value;
}

/** API fraction "0.4000" -> percent "40" (what the admin types). */
export function fractionToPercent(fraction: string): string {
  return trimZeros(fromUnits(toUnits(fraction, 4), 2));
}

/** Percent "37.5" -> API fraction "0.3750". */
export function percentToFraction(percent: string): string {
  return fromUnits(toUnits(percent, 2), 4);
}