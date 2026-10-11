/** Same day-of-month `months` later, clamped to the month's last day (Jan 31 + 1 month = Feb 28). */
export function addMonthsUtc(from: Date, months: number): Date {
  const year = from.getUTCFullYear();
  const month = from.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(from.getUTCDate(), lastDay)));
}

export const isoDate = (date: Date) => date.toISOString().slice(0, 10);