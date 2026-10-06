// Tunisian IBAN: TN + 2 check digits + 20 digits (bank 2, branch 3, account 13, RIB key 2).
import { randomInt } from "node:crypto";

const BANK_CODE = "08";
const BRANCH_CODE = "001";

function mod97(numeric: string): number {
  let remainder = 0;
  for (const digit of numeric) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder;
}

export function buildTnIban(accountNumber13: string): string {
  if (!/^\d{13}$/.test(accountNumber13)) {
    throw new Error("Account number must be exactly 13 digits");
  }
  const base = `${BANK_CODE}${BRANCH_CODE}${accountNumber13}`;
  const ribKey = String(97 - mod97(`${base}00`)).padStart(2, "0");
  const bban = `${base}${ribKey}`;
  // Move "TN00" to the end; T = 29, N = 23.
  const check = String(98 - mod97(`${bban}292300`)).padStart(2, "0");
  return `TN${check}${bban}`;
}

export function randomTnIban(): string {
  let account = "";
  for (let i = 0; i < 13; i++) account += String(randomInt(0, 10));
  return buildTnIban(account);
}

export function isValidTnIban(iban: string): boolean {
  if (!/^TN\d{22}$/.test(iban)) return false;
  // ISO 13616: move the first 4 characters to the end, letters become numbers (T=29, N=23).
  return mod97(`${iban.slice(4)}2923${iban.slice(2, 4)}`) === 1;
}