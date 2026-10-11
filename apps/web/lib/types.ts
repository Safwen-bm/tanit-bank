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

export type TransactionType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "TRANSFER"
  | "LOAN_DISBURSEMENT"
  | "LOAN_REPAYMENT"
  | "CARD_PAYMENT";

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


export interface LoanProduct {
  id: string;
  name: string;
  description: string | null;
  annualRate: string;
  minAmount: string;
  maxAmount: string;
  minMonths: number;
  maxMonths: number;
  maxDebtRatio: string;
  isActive: boolean;
}

export interface AdminLoanProduct extends LoanProduct {
  loanCount: number;
}

export interface ScheduleRow {
  number: number;
  payment: string;
  principal: string;
  interest: string;
  remaining: string;
}

export interface Simulation {
  product: { id: string; name: string; maxDebtRatio: string };
  amount: string;
  months: number;
  annualRate: string;
  monthlyPayment: string;
  totalPayment: string;
  totalInterest: string;
  minimumIncome: string;
  schedule: ScheduleRow[];
}


export type LoanStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID_OFF";

export interface LoanSummary {
  id: string;
  status: LoanStatus;
  amount: string;
  durationMonths: number;
  interestRate: string;
  monthlyPayment: string;
  totalPayment: string;
  totalInterest: string;
  debtRatio: string;
  flagged: boolean;
  purpose: string | null;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  disbursedAt: string | null;
  product: { id: string; name: string };
  account: { id: string; iban: string; label: string | null };
  paidInstallments: number;
  nextInstallment: { number: number; dueDate: string; amount: string } | null;
}

export interface LoanScheduleRow {
  number: number;
  dueDate: string | null;
  payment: string;
  principal: string;
  interest: string;
  remaining: string;
  status: "UNPAID" | "PAID" | null;
  paidAt: string | null;
}

export interface LoanDetail extends LoanSummary {
  schedule: LoanScheduleRow[];
}

export interface AdminLoanItem extends LoanSummary {
  customer: { id: string; fullName: string; email: string; monthlyIncome: string | null };
}

export interface AdminLoanDetail extends LoanDetail {
  customer: AdminLoanItem["customer"] & { otherCommitments: string };
}

export interface AdminApplicationsPage {
  items: AdminLoanItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  counts: Record<LoanStatus, number>;
}

export type ApplicationFilter = LoanStatus | "ALL";


export interface CashflowPoint {
  month: string;
  income: string;
  expenses: string;
}

export interface AdminStats {
  customers: number;
  newCustomers30d: number;
  openAccounts: number;
  totalDeposits: string;
  activeLoans: number;
  pendingLoans: number;
  outstandingPrincipal: string;
  transfers30d: { count: number; volume: string };
  series: { date: string; transactions: number; volume: string }[];
}

export interface AdminCustomerRow {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  monthlyIncome: string | null;
  accounts: number;
  totalBalance: string;
  activeLoans: number;
}

export interface AdminCustomersPage {
  items: AdminCustomerRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface AdminCustomerDetail {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  profile: { monthlyIncome: string; phone: string | null; address: string | null } | null;
  accounts: Account[];
  loans: LoanSummary[];
  recent: RecentTransaction[];
}

export interface AdminTx {
  id: string;
  type: TransactionType;
  amount: string;
  description: string | null;
  createdAt: string;
  from: { iban: string; name: string } | null;
  to: { iban: string; name: string } | null;
  initiatedBy: string | null;
}

export interface AdminTxPage {
  items: AdminTx[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface AdminTxFilters {
  type: TransactionType | "";
  from: string;
  to: string;
  q: string;
  page: number;
}


export interface BankCard {
  id: string;
  holderName: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  status: "ACTIVE" | "FROZEN";
  spendingLimit: string;
  spentThisMonth: string;
  remainingThisMonth: string;
  account: { id: string; iban: string; label: string | null };
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsPage {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface AuditItem {
  id: string;
  createdAt: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  actor: { id: string; fullName: string; email: string; role: "CUSTOMER" | "ADMIN" } | null;
}

export interface AuditPage {
  items: AuditItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  actions: string[];
}

export interface AuditFilters {
  action: string;
  from: string;
  to: string;
  q: string;
  page: number;
}