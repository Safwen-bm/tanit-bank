export type AccountType = "CURRENT" | "SAVINGS";
export type AccountStatus = "ACTIVE" | "FROZEN" | "CLOSED";

export interface Account {
  id: string;
  iban: string;
  type: AccountType;
  status: AccountStatus;
  balance: string;
  currency: string;
  label: string | null;
  createdAt: string;
}

export type TransactionType = "DEPOSIT" | "WITHDRAWAL" | "TRANSFER" | "LOAN_DISBURSEMENT" | "LOAN_REPAYMENT";

export interface TransactionView {
  id: string;
  type: TransactionType;
  direction: "IN" | "OUT";
  amount: string;
  balanceAfter: string | null;
  description: string | null;
  createdAt: string;
  counterparty: { iban: string; name: string } | null;
}

export interface RecentTransaction extends TransactionView {
  accountId: string;
  accountIban: string;
}

export interface HistoryPage {
  items: TransactionView[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface MoneyResult {
  transaction: TransactionView;
  replayed: boolean;
}

export interface HistoryFilters {
  type: TransactionType | "";
  from: string;
  to: string;
  q: string;
  page: number;
}