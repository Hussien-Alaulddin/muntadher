import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  adminPath,
  isAdminPublicPathname,
} from "@/lib/admin-base-path";
import { ADMIN_COOKIE } from "@/lib/admin-constants";
import { verifyAdminSessionToken } from "@/lib/admin-session";

/**
 * حماية مسار اللوحة السري.
 * المسار الحقيقي في App Router هو نفسه العلني (مثل /m-6769c0) —
 * لا نعتمد على rewrite لأن Edge middleware على Hostinger غير موثوق.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isAdminPublicPathname(pathname)) {
    return NextResponse.next();
  }

  const expected = process.env.ADMIN_API_TOKEN?.trim();
  const cookieToken = request.cookies.get(ADMIN_COOKIE)?.value;
  const hasSession =
    Boolean(expected) &&
    Boolean(cookieToken) &&
    (await verifyAdminSessionToken(cookieToken, expected!));

  const loginPublic = adminPath("/login");
  const homePublic = adminPath();

  if (pathname === loginPublic) {
    if (hasSession) {
      return NextResponse.redirect(new URL(homePublic, request.url));
    }
    return NextResponse.next();
  }

  if (!expected) {
    return NextResponse.redirect(
      new URL(`${loginPublic}?error=unconfigured`, request.url),
    );
  }

  if (!hasSession) {
    const login = new URL(loginPublic, request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/m-6769c0",
    "/m-6769c0/:path*",
  ],
};
