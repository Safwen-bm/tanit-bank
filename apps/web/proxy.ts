import { NextResponse, type NextRequest } from "next/server";

/**
 * Routing gate only. It reads the `tb_role` hint cookie set by the API, so a visitor
 * lands on the right side of the app without a flash. Real security is enforced by
 * the API (JWT + role guards): editing this cookie by hand unlocks nothing.
 */
const CUSTOMER_PREFIXES = ["/dashboard", "/accounts", "/transfers", "/cards", "/notifications", "/loans"];

function isAdminPath(path: string) {
  return path === "/admin" || path.startsWith("/admin/");
}

function isCustomerPath(path: string) {
  if (path === "/loans/simulator" || path.startsWith("/loans/simulator/")) return false; // public
  return CUSTOMER_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const role = request.cookies.get("tb_role")?.value;

  const admin = isAdminPath(pathname);
  const customer = isCustomerPath(pathname);
  if (!admin && !customer) return NextResponse.next();

  if (!role) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (admin && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (customer && role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/accounts/:path*",
    "/transfers/:path*",
    "/cards/:path*",
    "/notifications/:path*",
    "/loans/:path*",
    "/admin/:path*",
  ],
};