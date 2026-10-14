"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useNotifications } from "@/lib/queries";
import type { NotificationItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const query = useNotifications(unreadOnly, page);
  const data = query.data;

  const markRead = useMutation({
    mutationFn: (id: string) => api(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => void queryClient.invalidateQueries(),
  });
  const markAll = useMutation({
    mutationFn: () => api("/notifications/read-all", { method: "POST" }),
    onSuccess: () => {
      toast.success("All caught up");
      void queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.message),
  });

  function open(item: NotificationItem) {
    if (!item.readAt) markRead.mutate(item.id);
    if (item.link) router.push(item.link);
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="What happened."
        action={
          <Button
            variant="outline"
            size="sm"
            loading={markAll.isPending}
            disabled={!data || data.unreadCount === 0}
            onClick={() => markAll.mutate()}
          >
            Mark all as read
          </Button>
        }
      />

      <div role="tablist" className="flex gap-7 border-b border-ink/20">
        {[
          { label: "All", value: false },
          { label: `Unread${data ? ` (${data.unreadCount})` : ""}`, value: true },
        ].map((tab) => (
          <button
            key={tab.label}
            role="tab"
            aria-selected={unreadOnly === tab.value}
            onClick={() => {
              setUnreadOnly(tab.value);
              setPage(1);
            }}
            className={cn(
              "-mb-px cursor-pointer border-b-[3px] pb-3 text-base font-semibold transition-colors",
              unreadOnly === tab.value
                ? "border-brand text-ink"
                : "border-transparent text-ink-soft hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="border border-ink/20 bg-card">
        {query.isLoading ? (
          <p className="py-12 text-center text-ink-soft">Loading...</p>
        ) : data && data.items.length > 0 ? (
          <ul className="divide-y divide-ink/15">
            {data.items.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => open(item)}
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-4 border-l-4 px-5 py-5 text-left transition-colors hover:bg-paper-2/60",
                    item.readAt ? "border-transparent" : "border-brand",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-lg", item.readAt ? "font-medium" : "font-bold")}>{item.title}</span>
                    <span className="mt-1 block text-ink-soft">{item.body}</span>
                  </span>
                  {!item.readAt && <span className="sr-only">Unread</span>}
                  <span className="num shrink-0 pt-1 text-xs text-ink-soft">{formatDateTime(item.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-12 text-center text-ink-soft">
            {unreadOnly ? "Nothing unread." : "No notifications yet. Transfers you receive and loan decisions show up here."}
          </p>
        )}
      </div>

      {data && data.pageCount > 1 && (
        <div className="flex items-center justify-between">
          <p className="num text-sm text-ink-soft">
            Page {data.page} of {data.pageCount}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
              <ChevronLeft className="size-4" aria-hidden="true" />
              Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.pageCount} onClick={() => setPage((value) => value + 1)}>
              Next
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
