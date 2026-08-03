/**
 * يسمح فقط بمسارات نسبية داخل الموقع.
 * يرفض الروابط الخارجية و protocol-relative (//evil.com) لمنع open redirect.
 */
import { adminPath, isAdminPublicPathname } from "@/lib/admin-base-path";

export function sanitizeNext(
  value: string | null | undefined,
  fallback = "/products",
): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("\\") || trimmed.includes("://")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) return fallback;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return fallback;
  return trimmed;
}

/** مسارات لوحة التحكم العلنية فقط */
export function sanitizeAdminNext(
  value: string | null | undefined,
  fallback?: string,
): string {
  const safeFallback = fallback ?? adminPath();
  const next = sanitizeNext(value, safeFallback);
  if (!isAdminPublicPathname(next)) return safeFallback;
  return next;
}
