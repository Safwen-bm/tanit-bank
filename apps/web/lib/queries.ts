import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type {
  Account,
  AdminApplicationsPage,
  AdminLoanDetail,
  AdminLoanProduct,
  ApplicationFilter,
  HistoryFilters,
  HistoryPage,
  LoanDetail,
  LoanProduct,
  LoanSummary,
  RecentTransaction,
  AdminCustomerDetail,
  AdminCustomersPage,
  AdminStats,
  AdminTxFilters,
  AdminTxPage,
  CashflowPoint,
  AuditFilters,
  AuditPage,
  BankCard,
  NotificationsPage,
} from "./types";

export const PAGE_SIZE = 10;

export function useAccounts() {
  return useQuery({ queryKey: ["accounts"], queryFn: () => api<Account[]>("/accounts") });
}

export function useAccount(id: string) {
  return useQuery({ queryKey: ["account", id], queryFn: () => api<Account>(`/accounts/${id}`) });
}

export function useRecent(limit = 8) {
  return useQuery({
    queryKey: ["recent", limit],
    queryFn: () => api<RecentTransaction[]>(`/transactions/recent?limit=${limit}`),
  });
}

export function useHistory(accountId: string, filters: HistoryFilters) {
  const params = new URLSearchParams({ page: String(filters.page), pageSize: String(PAGE_SIZE) });
  if (filters.type) params.set("type", filters.type);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.q.trim()) params.set("q", filters.q.trim());

  return useQuery({
    queryKey: ["history", accountId, filters],
    queryFn: () => api<HistoryPage>(`/accounts/${accountId}/transactions?${params}`),
    placeholderData: keepPreviousData,
  });
}


export function usePublicProducts() {
  return useQuery({
    queryKey: ["public-products"],
    queryFn: () => api<LoanProduct[]>("/public/loan-products", { auth: false }),
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: () => api<AdminLoanProduct[]>("/admin/loan-products"),
  });
}


export function useMyLoans() {
  return useQuery({ queryKey: ["loans"], queryFn: () => api<LoanSummary[]>("/loans") });
}

export function useLoan(id: string) {
  return useQuery({ queryKey: ["loan", id], queryFn: () => api<LoanDetail>(`/loans/${id}`) });
}

export function useAdminApplications(status: ApplicationFilter, page: number) {
  return useQuery({
    queryKey: ["admin-applications", status, page],
    queryFn: () => api<AdminApplicationsPage>(`/admin/loan-applications?status=${status}&page=${page}&pageSize=8`),
    placeholderData: keepPreviousData,
  });
}

export function useAdminApplication(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ["admin-application", id],
    queryFn: () => api<AdminLoanDetail>(`/admin/loan-applications/${id}`),
    enabled,
  });
}


export function useCashflow(months = 6) {
  return useQuery({
    queryKey: ["cashflow", months],
    queryFn: () => api<CashflowPoint[]>(`/transactions/summary?months=${months}`),
  });
}

export function useAdminStats() {
  return useQuery({ queryKey: ["admin-stats"], queryFn: () => api<AdminStats>("/admin/stats") });
}

export function useAdminCustomers(q: string, page: number) {
  const params = new URLSearchParams({ page: String(page), pageSize: "10" });
  if (q.trim()) params.set("q", q.trim());
  return useQuery({
    queryKey: ["admin-customers", q.trim(), page],
    queryFn: () => api<AdminCustomersPage>(`/admin/customers?${params}`),
    placeholderData: keepPreviousData,
  });
}

export function useAdminCustomer(id: string) {
  return useQuery({
    queryKey: ["admin-customer", id],
    queryFn: () => api<AdminCustomerDetail>(`/admin/customers/${id}`),
  });
}

export function useAdminTransactions(filters: AdminTxFilters) {
  const params = new URLSearchParams({ page: String(filters.page), pageSize: "15" });
  if (filters.type) params.set("type", filters.type);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.q.trim()) params.set("q", filters.q.trim());
  return useQuery({
    queryKey: ["admin-transactions", filters],
    queryFn: () => api<AdminTxPage>(`/admin/transactions?${params}`),
    placeholderData: keepPreviousData,
  });
}


export function useCards() {
  return useQuery({ queryKey: ["cards"], queryFn: () => api<BankCard[]>("/cards") });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["unread-count"],
    queryFn: () => api<{ unreadCount: number }>("/notifications/unread-count"),
    refetchInterval: 30_000,
  });
}

export function useNotifications(unreadOnly: boolean, page: number) {
  return useQuery({
    queryKey: ["notifications", unreadOnly, page],
    queryFn: () => api<NotificationsPage>(`/notifications?page=${page}&pageSize=12${unreadOnly ? "&unread=true" : ""}`),
    placeholderData: keepPreviousData,
  });
}

export function useAdminAudit(filters: AuditFilters) {
  const params = new URLSearchParams({ page: String(filters.page), pageSize: "20" });
  if (filters.action) params.set("action", filters.action);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.q.trim()) params.set("q", filters.q.trim());
  return useQuery({
    queryKey: ["admin-audit", filters],
    queryFn: () => api<AuditPage>(`/admin/audit-logs?${params}`),
    placeholderData: keepPreviousData,
  });
}