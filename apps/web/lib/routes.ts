import type { Role } from "./api";

export function homeFor(role: Role) {
  return role === "ADMIN" ? "/admin" : "/dashboard";
}

/** Only allow same-site relative paths after login (blocks open redirects). */
export function safeNext(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}