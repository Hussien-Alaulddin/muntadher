import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import {
  createAdminSessionToken,
  timingSafeEqualString,
  verifyAdminSessionToken,
  ADMIN_SESSION_DAYS,
} from "@/lib/admin-session";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const WEEK = ADMIN_SESSION_DAYS * 60 * 60 * 24;

function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

/** تسجيل دخول — يتحقق من التوكن ويضبط كوكي جلسة موقّعة */
export async function POST(request: Request) {
  const expected = process.env.ADMIN_API_TOKEN?.trim();
  if (!expected) {
    return NextResponse.json(
      { message: "لوحة التحكم غير مهيأة: اضبط ADMIN_API_TOKEN" },
      { status: 503 },
    );
  }

  const limited = rateLimit(`admin-auth:${clientIp(request)}`, 10, 15 * 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { message: "محاولات كثيرة — حاول لاحقاً" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    token?: string;
  } | null;

  const token = body?.token?.trim() ?? "";
  if (!timingSafeEqualString(token, expected)) {
    return NextResponse.json(
      { message: "كلمة المرور غير صحيحة" },
      { status: 401 },
    );
  }

  const session = await createAdminSessionToken(expected);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, session, sessionCookieOptions(WEEK));
  return response;
}

/** تسجيل خروج */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", sessionCookieOptions(0));
  return response;
}

/** التحقق من الجلسة الحالية */
export async function GET(request: Request) {
  const expected = process.env.ADMIN_API_TOKEN?.trim();
  if (!expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const header = request.headers.get("x-admin-token");
  if (header && timingSafeEqualString(header, expected)) {
    return NextResponse.json({ ok: true });
  }

  const cookieHeader = request.headers.get("cookie");
  const match = cookieHeader?.match(
    new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]*)`),
  );
  const cookieToken = match ? decodeURIComponent(match[1]) : null;
  const ok = await verifyAdminSessionToken(cookieToken, expected);
  return NextResponse.json({ ok }, { status: ok ? 200 : 401 });
}
