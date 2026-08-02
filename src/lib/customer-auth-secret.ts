/**
 * سر توقيع جلسات العملاء و OAuth state.
 * في الإنتاج: CUSTOMER_AUTH_SECRET إلزامي (لا يُشارك مع توكن الأدمن).
 * في التطوير فقط: يُسمح ببديل ADMIN_API_TOKEN مع تحذير.
 */
export function getCustomerAuthSecret(): string | null {
  const dedicated = process.env.CUSTOMER_AUTH_SECRET?.trim();
  if (dedicated) return dedicated;

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const fallback = process.env.ADMIN_API_TOKEN?.trim();
  if (fallback) {
    console.warn(
      "[auth] CUSTOMER_AUTH_SECRET غير مضبوط — يُستخدم ADMIN_API_TOKEN مؤقتاً في التطوير فقط",
    );
    return fallback;
  }

  return null;
}
