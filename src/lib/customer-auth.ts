import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import {
  CUSTOMER_COOKIE,
  CUSTOMER_SESSION_DAYS,
} from "@/lib/customer-constants";
import { getCustomerAuthSecret } from "@/lib/customer-auth-secret";
import { getPrisma } from "@/lib/prisma";

function authSecret(): string | null {
  return getCustomerAuthSecret();
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** قيمة كوكي الجلسة: customerId.expiryUnix.signature */
export function createSessionToken(customerId: string): string | null {
  const secret = authSecret();
  if (!secret) return null;
  const expiry =
    Math.floor(Date.now() / 1000) + CUSTOMER_SESSION_DAYS * 24 * 60 * 60;
  const payload = `${customerId}.${expiry}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function parseSessionToken(
  token: string | null | undefined,
): { customerId: string } | null {
  if (!token) return null;
  const secret = authSecret();
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [customerId, expiryStr, signature] = parts;
  if (!customerId || !expiryStr || !signature) return null;

  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry * 1000 < Date.now()) return null;

  const payload = `${customerId}.${expiryStr}`;
  const expected = sign(payload, secret);
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return { customerId };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export type CustomerSession = {
  id: string;
  email: string;
  name: string;
};

/** يقرأ جلسة العميل من كوكي الطلب (Route Handlers) */
export function customerIdFromRequest(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  const match = header.match(
    new RegExp(`(?:^|;\\s*)${CUSTOMER_COOKIE}=([^;]*)`),
  );
  if (!match) return null;
  const parsed = parseSessionToken(decodeURIComponent(match[1]));
  return parsed?.customerId ?? null;
}

/** جلسة العميل في Server Components */
export async function getCustomerSession(): Promise<CustomerSession | null> {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  const parsed = parseSessionToken(token);
  if (!parsed) return null;

  const prisma = getPrisma();
  if (!prisma) return null;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parsed.customerId },
      select: { id: true, email: true, name: true },
    });
    return customer;
  } catch {
    return null;
  }
}
