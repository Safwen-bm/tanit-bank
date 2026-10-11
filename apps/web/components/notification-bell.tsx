"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useUnreadCount } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function NotificationBell({ className }: { className?: string }) {
  const { data } = useUnreadCount();
  const count = data?.unreadCount ?? 0;

  return (
    <Link
      href="/notifications"
      aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      className={cn("relative inline-flex size-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink", className)}
    >
      <Bell className="size-5" aria-hidden="true" />
      {count > 0 && (
        <span className="num absolute -top-0.5 -right-0.5 flex min-w-4.5 items-center justify-center rounded-full border-2 border-card bg-accent px-1 text-[10px] font-semibold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}