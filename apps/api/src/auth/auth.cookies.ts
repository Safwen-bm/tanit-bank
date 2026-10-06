import type { CookieOptions, Response } from "express";
import { Role } from "../generated/prisma/enums";

export const REFRESH_COOKIE = "tb_refresh";
export const ROLE_COOKIE = "tb_role";
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// The browser sees the API under /api/*, so the refresh cookie is scoped to /api/auth.
const REFRESH_PATH = "/api/auth";

function base(): CookieOptions {
  return {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
}

export function setAuthCookies(res: Response, refreshToken: string, role: Role) {
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...base(),
    httpOnly: true,
    path: REFRESH_PATH,
    maxAge: REFRESH_TTL_MS,
  });
  // Routing hint only, read by Next's proxy.ts. The API never trusts it.
  res.cookie(ROLE_COOKIE, role, {
    ...base(),
    httpOnly: false,
    path: "/",
    maxAge: REFRESH_TTL_MS,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { ...base(), httpOnly: true, path: REFRESH_PATH });
  res.clearCookie(ROLE_COOKIE, { ...base(), httpOnly: false, path: "/" });
}