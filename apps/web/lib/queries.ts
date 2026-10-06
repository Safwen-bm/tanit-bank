import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { Account, HistoryFilters, HistoryPage, RecentTransaction } from "./types";

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