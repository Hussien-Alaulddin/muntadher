import { createHmac, timingSafeEqual } from "crypto";
import { getCustomerAuthSecret } from "@/lib/customer-auth-secret";

function mediaSignSecret(): string | null {
  return (
    process.env.MEDIA_SIGNING_SECRET?.trim() ||
    getCustomerAuthSecret()
  );
}

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** رابط محلي موقّع: /api/media/local?key=&productId=&exp=&sig= */
export function createSignedLocalMediaUrl(options: {
  objectKey: string;
  productId?: string;
  expiresInSeconds?: number;
}): string | null {
  const secret = mediaSignSecret();
  if (!secret) return null;

  const exp =
    Math.floor(Date.now() / 1000) + (options.expiresInSeconds ?? 60 * 60 * 2);
  const key = options.objectKey.replace(/^\/+/, "");
  const productId = options.productId?.trim() || "";
  const payload = `${key}.${productId}.${exp}`;
  const sig = signPayload(payload, secret);

  const params = new URLSearchParams({
    key,
    exp: String(exp),
    sig,
  });
  if (productId) params.set("productId", productId);
  return `/api/media/local?${params.toString()}`;
}

export function verifySignedLocalMediaParams(options: {
  key: string;
  productId: string;
  exp: string;
  sig: string;
}): boolean {
  const secret = mediaSignSecret();
  if (!secret) return false;

  const expNum = Number(options.exp);
  if (!Number.isFinite(expNum) || expNum * 1000 < Date.now()) return false;

  const payload = `${options.key}.${options.productId}.${options.exp}`;
  const expected = signPayload(payload, secret);
  try {
    const a = Buffer.from(options.sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
