import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { resolveClientGeo } from "@/lib/client-geo";
import { getCustomerAuthSecret } from "@/lib/customer-auth-secret";
import { getPrisma } from "@/lib/prisma";
import { sanitizeNext } from "@/lib/safe-redirect";

export { sanitizeNext } from "@/lib/safe-redirect";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
export const GOOGLE_STATE_COOKIE = "montader_google_oauth";

function authSecret(): string | null {
  return getCustomerAuthSecret();
}

export function googleOAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

export function siteOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  return new URL(request.url).origin;
}

export function googleRedirectUri(request: Request) {
  return `${siteOrigin(request)}/api/auth/google/callback`;
}

function signState(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createGoogleOAuthState(nextPath: string): string | null {
  const secret = authSecret();
  if (!secret) return null;
  const nonce = randomBytes(16).toString("base64url");
  const next = sanitizeNext(nextPath);
  const payload = `${nonce}.${Buffer.from(next, "utf8").toString("base64url")}`;
  return `${payload}.${signState(payload, secret)}`;
}

export function parseGoogleOAuthState(
  cookieValue: string | undefined,
  stateParam: string | null,
): { next: string } | null {
  const secret = authSecret();
  if (!secret || !cookieValue || !stateParam) return null;
  if (cookieValue !== stateParam) return null;

  const parts = cookieValue.split(".");
  if (parts.length !== 3) return null;
  const [nonce, nextB64, signature] = parts;
  if (!nonce || !nextB64 || !signature) return null;

  const payload = `${nonce}.${nextB64}`;
  const expected = signState(payload, secret);
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const next = Buffer.from(nextB64, "base64url").toString("utf8");
    return { next: sanitizeNext(next) };
  } catch {
    return null;
  }
}

export function buildGoogleAuthUrl(request: Request, state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
    redirect_uri: googleRedirectUri(request),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export function googleStateCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

type GoogleProfile = {
  sub: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
};

export async function exchangeGoogleCode(
  request: Request,
  code: string,
): Promise<GoogleProfile> {
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
      redirect_uri: googleRedirectUri(request),
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    throw new Error("تعذّر التحقق من حساب Google");
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error("تعذّر الحصول على صلاحية Google");
  }

  const profileRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!profileRes.ok) {
    throw new Error("تعذّر قراءة بيانات حساب Google");
  }

  return (await profileRes.json()) as GoogleProfile;
}

export async function upsertCustomerFromGoogle(
  request: Request,
  profile: GoogleProfile,
) {
  const email = profile.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("حساب Google بدون بريد صالح");
  }
  const verified =
    profile.email_verified === true || profile.email_verified === "true";
  if (!verified) {
    throw new Error("بريد Google غير مؤكَّد");
  }

  const prisma = getPrisma();
  if (!prisma) throw new Error("قاعدة البيانات غير متاحة");

  const name =
    profile.name?.trim() || email.split("@")[0] || "مستخدم منتظر";
  const googleId = profile.sub;
  const googleAvatarUrl = profile.picture?.trim() || null;
  const customerSelect = {
    id: true,
    email: true,
    name: true,
    avatarUrl: true,
    googleAvatarUrl: true,
  } as const;

  const byGoogle = await prisma.customer.findUnique({
    where: { googleId },
    select: customerSelect,
  });
  if (byGoogle) {
    return prisma.customer.update({
      where: { id: byGoogle.id },
      data: {
        ...(googleAvatarUrl ? { googleAvatarUrl } : {}),
      },
      select: customerSelect,
    });
  }

  const byEmail = await prisma.customer.findUnique({
    where: { email },
    select: {
      ...customerSelect,
      passwordHash: true,
      googleId: true,
    },
  });

  if (byEmail) {
    // لا نربط تلقائياً حساباً بكلمة مرور — يمنع استباق البريد ثم سرقة دخول Google
    if (byEmail.passwordHash && !byEmail.googleId) {
      throw new Error(
        "هذا البريد مسجّل مسبقاً بكلمة مرور. سجّل الدخول ثم اربط Google من الإعدادات لاحقاً.",
      );
    }

    return prisma.customer.update({
      where: { id: byEmail.id },
      data: {
        googleId,
        name: byEmail.name || name,
        ...(googleAvatarUrl ? { googleAvatarUrl } : {}),
      },
      select: customerSelect,
    });
  }

  const geo = await resolveClientGeo(request);
  return prisma.customer.create({
    data: {
      email,
      name,
      googleId,
      googleAvatarUrl,
      passwordHash: null,
      countryCode: geo.countryCode,
      country: geo.country,
      region: geo.region,
      city: geo.city,
    },
    select: customerSelect,
  });
}
