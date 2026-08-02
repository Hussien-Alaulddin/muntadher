type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * حد معدّل بسيط في الذاكرة — مناسب لمثيل Node واحد (Hostinger/Vercel instance).
 * ليس بديلاً عن WAF على نطاق كبير، لكنه يوقف التخمين السريع.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (current.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

/**
 * يستخرج IP العميل خلف بروكسي واحد.
 * يفضّل x-real-ip / cf-connecting-ip، ويأخذ آخر hop من XFF
 * (البروكسي يضيف الحقيقي في النهاية — الأول قابل للتزوير من العميل).
 */
export function clientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const last = hops[hops.length - 1];
    if (last) return last;
  }

  return "unknown";
}
