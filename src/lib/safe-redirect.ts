/**
 * يسمح فقط بمسارات نسبية داخل الموقع.
 * يرفض الروابط الخارجية و protocol-relative (//evil.com) لمنع open redirect.
 */
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

/** مسارات لوحة التحكم فقط */
export function sanitizeAdminNext(
  value: string | null | undefined,
  fallback = "/admin",
): string {
  const next = sanitizeNext(value, fallback);
  if (!next.startsWith("/admin")) return fallback;
  return next;
}
