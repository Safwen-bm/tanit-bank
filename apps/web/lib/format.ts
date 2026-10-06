const tnd = new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

/** Money arrives from the API as a decimal string; it is only converted for display. */
export function formatTnd(value: string | number) {
  return `${tnd.format(Number(value))} TND`;
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

/** TN59 0800 1000 ... in groups of four. */
export function formatIban(iban: string) {
  return iban.replace(/(.{4})/g, "$1 ").trim();
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}