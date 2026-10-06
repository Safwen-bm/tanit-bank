import { Prisma } from "../generated/prisma/client";
import { money } from "../common/money";

const accountSelect = {
  select: {
    id: true,
    iban: true,
    type: true,
    userId: true,
    user: { select: { fullName: true } },
  },
} as const;

export const TX_INCLUDE = {
  fromAccount: accountSelect,
  toAccount: accountSelect,
} satisfies Prisma.TransactionInclude;

export type TransactionWithAccounts = Prisma.TransactionGetPayload<{ include: typeof TX_INCLUDE }>;

type CounterpartyAccount = TransactionWithAccounts["fromAccount"];

function counterpartyOf(account: CounterpartyAccount) {
  if (!account) return null;
  return {
    iban: account.iban,
    name: account.type === "TREASURY" ? "Tanit Bank" : (account.user?.fullName ?? "Unknown"),
  };
}

/** A transaction seen from one account: money in or out, and who is on the other side. */
export function toTransactionView(tx: TransactionWithAccounts, perspectiveAccountId: string) {
  const incoming = tx.toAccountId === perspectiveAccountId;
  const balanceAfter = incoming ? tx.toBalanceAfter : tx.fromBalanceAfter;
  return {
    id: tx.id,
    type: tx.type,
    direction: incoming ? ("IN" as const) : ("OUT" as const),
    amount: money(tx.amount),
    balanceAfter: balanceAfter ? money(balanceAfter) : null,
    description: tx.description,
    createdAt: tx.createdAt,
    counterparty: counterpartyOf(incoming ? tx.fromAccount : tx.toAccount),
  };
}