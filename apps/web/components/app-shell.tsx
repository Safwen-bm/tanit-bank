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
import { NotificationBell } from "./notification-bell";
import { TanitLogo } from "./tanit-logo";
import { TanitMark } from "./tanit-mark";
import { ThemeSwitcher } from "./theme-switcher";
import { Button } from "./ui/button";

function isActive(pathname: string, item: NavItem) {
  if (item.href === "/admin" || item.href === "/dashboard") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** `row` is the horizontal version used in the mobile header. */
function NavLink({ item, pathname, row = false }: { item: NavItem; pathname: string; row?: boolean }) {
  const Icon = item.icon;
  const active = isActive(pathname, item);
  const base = row
    ? "flex items-center gap-2 border-b-[3px] px-3.5 py-3 text-sm font-semibold whitespace-nowrap"
    : "flex items-center gap-3 border-l-4 px-6 py-3 text-[15px] font-semibold whitespace-nowrap";

  if (!item.ready) {
    return (
      <span className={cn(base, "cursor-not-allowed border-transparent text-ink-soft/50")} aria-disabled="true">
        <Icon className="size-4" aria-hidden="true" />
        {item.label}
        <span className="ml-auto text-xs font-medium">Soon</span>
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
        active
          ? cn("border-brand text-ink", row ? "" : "bg-paper-2")
          : "border-transparent text-ink-soft hover:text-ink",
      )}
    >
      <Icon className={cn("size-[18px]", active && "text-brand")} aria-hidden="true" />
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
      <div className="flex min-h-dvh items-center justify-center bg-paper">
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
      <aside className="sticky top-0 hidden h-dvh flex-col border-t-8 border-r border-ink/20 border-t-brand bg-card lg:flex">
        <div className="flex items-center justify-between px-6 pt-7 pb-7">
          <Link href={homeFor(role)} aria-label="Tanit Bank, home">
            <TanitLogo />
          </Link>
          {role === "CUSTOMER" && <NotificationBell />}
        </div>
        {role === "ADMIN" && (
          <p className="mx-6 mb-5 w-fit bg-ink px-2.5 py-1 text-xs font-semibold text-paper">Back office</p>
        )}
        <nav className="flex-1 space-y-0.5 overflow-y-auto" aria-label="Main">
          {nav.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
        <div className="space-y-4 border-t border-ink/20 p-6">
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

      <div className="flex min-h-dvh flex-col bg-paper">
        <header className="border-t-8 border-b border-ink/20 border-t-brand bg-card lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href={homeFor(role)} aria-label="Tanit Bank, home">
              <TanitLogo />
            </Link>
            <div className="flex items-center gap-3">
              {role === "CUSTOMER" && <NotificationBell />}
              <ThemeSwitcher compact />
              <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Sign out">
                <LogOut className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
          <nav className="flex overflow-x-auto border-t border-ink/15 px-2" aria-label="Main">
            {nav.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} row />
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 lg:py-14">{children}</main>
      </div>
    </div>
  );
}
