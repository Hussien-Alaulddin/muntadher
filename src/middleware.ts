import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-constants";
import { verifyAdminSessionToken } from "@/lib/admin-session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const expected = process.env.ADMIN_API_TOKEN?.trim();
  const cookieToken = request.cookies.get(ADMIN_COOKIE)?.value;
  const hasSession =
    Boolean(expected) &&
    Boolean(cookieToken) &&
    (await verifyAdminSessionToken(cookieToken, expected!));

  if (pathname === "/admin/login") {
    if (hasSession) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!expected) {
    return NextResponse.redirect(
      new URL("/admin/login?error=unconfigured", request.url),
    );
  }

  if (!hasSession) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
