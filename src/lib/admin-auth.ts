import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import { ADMIN_COOKIE } from "@/lib/admin-constants";
import {
  timingSafeEqualString,
  verifyAdminSessionToken,
} from "@/lib/admin-session";

export { ADMIN_COOKIE };

function tokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/** يقرأ التوكن من ترويسة x-admin-token أو من كوكي الجلسة */
export function getAdminToken(request: Request): string | null {
  const header = request.headers.get("x-admin-token");
  if (header) return header;
  return tokenFromCookieHeader(request.headers.get("cookie"));
}

/**
 * حماية واجهات لوحة التحكم:
 * - كوكي جلسة موقّعة (المتصفح)
 * - أو ترويسة x-admin-token بالقيمة الخام لـ ADMIN_API_TOKEN (أدوات/API)
 * لو التوكن غير مضبوط، تُرفض كل الطلبات (fail closed).
 */
export async function checkAdmin(
  request: Request,
): Promise<NextResponse | null> {
  const expected = process.env.ADMIN_API_TOKEN?.trim();

  if (!expected) {
    return NextResponse.json(
      { message: "لوحة التحكم غير مهيأة: اضبط ADMIN_API_TOKEN" },
      { status: 503 },
    );
  }

  const header = request.headers.get("x-admin-token");
  if (header && timingSafeEqualString(header, expected)) {
    return null;
  }

  const cookieToken = tokenFromCookieHeader(request.headers.get("cookie"));
  if (cookieToken && (await verifyAdminSessionToken(cookieToken, expected))) {
    return null;
  }

  return NextResponse.json({ message: "غير مصرّح" }, { status: 401 });
}

export async function isValidAdminRequest(
  request: Request,
): Promise<boolean> {
  return (await checkAdmin(request)) === null;
}

/** للتوافق مع استدعاءات قديمة تعتمد على التوكن الخام */
export function isValidAdminToken(token: string | null | undefined): boolean {
  const expected = process.env.ADMIN_API_TOKEN?.trim();
  return Boolean(expected && token && timingSafeEqualString(token, expected));
}

type DatabaseResult =
  | { prisma: PrismaClient; error: null }
  | { prisma: null; error: NextResponse };

export function requireDatabase(): DatabaseResult {
  const prisma = getPrisma();

  if (!prisma) {
    return {
      prisma: null,
      error: NextResponse.json(
        { message: "قاعدة البيانات غير مربوطة: اضبط DATABASE_URL" },
        { status: 503 },
      ),
    };
  }

  return { prisma, error: null };
}
