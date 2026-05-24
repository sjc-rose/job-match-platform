import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_AUTH_COOKIE, ADMIN_AUTH_VALUE } from "@/lib/adminAuth";

const ADMIN_LOGIN_PATH = "/admin/login";
const PUBLIC_ADMIN_API_PATHS = new Set([
  "/api/admin/login",
  "/api/admin/logout",
]);

function isAuthenticated(request: NextRequest) {
  return request.cookies.get(ADMIN_AUTH_COOKIE)?.value === ADMIN_AUTH_VALUE;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminApi = pathname.startsWith("/api/admin/");
  const isPublicAdminApi = PUBLIC_ADMIN_API_PATHS.has(pathname);
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLoginPage = pathname === ADMIN_LOGIN_PATH;
  const hasAdminAuth = isAuthenticated(request);

  if (isAdminApi && !isPublicAdminApi && !hasAdminAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isAdminPage && !isLoginPage && !hasAdminAuth) {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && hasAdminAuth) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
