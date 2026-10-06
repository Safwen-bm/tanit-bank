"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ADMIN_NAV, CUSTOMER_NAV, type NavItem } from "@/lib/nav";
import type { Role } from "@/lib/api";
import { homeFor } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useAuth } from "./auth-provider";
import { TanitMark } from "./tanit-mark";
import { ThemeSwitcher } from "./theme-switcher";
import { Button } from "./ui/button";

function isActive(pathname: string, item: NavItem) {
  if (item.href === "/admin" || item.href === "/dashboard") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const active = isActive(pathname, item);
  const base = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap";

  if (!item.ready) {
    return (
      <span className={cn(base, "cursor-not-allowed text-ink-soft/50")} aria-disabled="true">
        <Icon className="size-4" aria-hidden="true" />
        {item.label}
        <span className="num ml-auto text-[10px] tracking-wider uppercase">soon</span>
      </span>
    );
  }
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        base,
        "transition-colors",
        active ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-2 hover:text-ink",
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

export function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const nav = role === "ADMIN" ? ADMIN_NAV : CUSTOMER_NAV;

  const allowed = status === "authenticated" && user?.role === role;

  useEffect(() => {
    if (status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (status === "authenticated" && user && user.role !== role) {
      router.replace(homeFor(user.role));
    }
  }, [status, user, role, pathname, router]);

  if (!allowed || !user) {
    return (
      <div className="ledger flex min-h-dvh items-center justify-center">
        <TanitMark className="size-10 animate-pulse text-brand" />
      </div>
    );
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[270px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r-2 border-ink bg-card lg:flex">
        <div className="mosaic" />
        <div className="flex items-center gap-2.5 px-6 py-6 text-brand">
          <TanitMark className="size-7" />
          <span className="font-display text-xl font-semibold tracking-tight">Tanit Bank</span>
        </div>
        {role === "ADMIN" && (
          <p className="num mx-6 mb-3 text-[10px] tracking-[0.25em] text-accent uppercase">Back office</p>
        )}
        <nav className="flex-1 space-y-1 px-3" aria-label="Main">
          {nav.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
        <div className="space-y-4 border-t border-rule p-5">
          <div>
            <p className="truncate text-sm font-semibold">{user.fullName}</p>
            <p className="num truncate text-xs text-ink-soft">{user.email}</p>
          </div>
          <div className="flex items-center justify-between">
            <ThemeSwitcher compact />
            <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Sign out">
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      <div className="ledger flex min-h-dvh flex-col">
        <header className="border-b-2 border-ink bg-card lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-brand">
              <TanitMark className="size-6" />
              <span className="font-display text-lg font-semibold">Tanit Bank</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeSwitcher compact />
              <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Sign out">
                <LogOut className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3" aria-label="Main">
            {nav.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8 lg:py-12">{children}</main>
      </div>
    </div>
  );
}