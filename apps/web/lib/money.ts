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