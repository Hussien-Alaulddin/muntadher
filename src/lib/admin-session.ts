/**
 * جلسة أدمن موقّعة — لا تُخزَّن قيمة ADMIN_API_TOKEN الخام في الكوكي.
 * متوافق مع Edge (middleware) و Node (Route Handlers) عبر Web Crypto.
 */

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array | null {
  try {
    const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
    const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(mac);
}

export const ADMIN_SESSION_DAYS = 7;

/** صيغة الكوكي: admin.<expiryUnix>.<signature> */
export async function createAdminSessionToken(secret: string): Promise<string> {
  const expiry =
    Math.floor(Date.now() / 1000) + ADMIN_SESSION_DAYS * 24 * 60 * 60;
  const payload = `admin.${expiry}`;
  return `${payload}.${await sign(payload, secret)}`;
}

export async function verifyAdminSessionToken(
  token: string | null | undefined,
  secret: string,
): Promise<boolean> {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [prefix, expiryStr, signature] = parts;
  if (prefix !== "admin" || !expiryStr || !signature) return false;

  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry * 1000 < Date.now()) return false;

  const payload = `admin.${expiryStr}`;
  const expected = await sign(payload, secret);
  const a = fromBase64Url(signature);
  const b = fromBase64Url(expected);
  if (!a || !b) return false;
  return timingSafeEqualBytes(a, b);
}

/** مقارنة توكن الأدمن الخام (لهيدر x-admin-token فقط) */
export function timingSafeEqualString(a: string, b: string): boolean {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  if (left.length !== right.length) {
    timingSafeEqualBytes(left, left);
    return false;
  }
  return timingSafeEqualBytes(left, right);
}
