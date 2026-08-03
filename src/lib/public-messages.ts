/**
 * رسائل عامة للمستخدم النهائي — بدون تفاصيل تقنية أو أسماء إعدادات.
 */

export const PUBLIC_MSG = {
  serviceUnavailable: "الخدمة غير متاحة مؤقتاً، حاول بعد قليل",
  tryAgainLater: "تعذّر إتمام العملية حالياً، حاول مرة أخرى لاحقاً",
  connectionFailed: "تعذّر الاتصال، تحقق من الإنترنت وحاول مرة أخرى",
  invalidRequest: "تعذّر فهم الطلب، حاول مرة أخرى",
  tooManyAttempts: "محاولات كثيرة — حاول لاحقاً",
  loginRequired: "يلزم تسجيل الدخول أولاً",
} as const;

/** أنماط تُستبعد من العرض للمستخدم (تسرّب تقني أو إنجليزي شبكة) */
const TECHNICAL_PATTERN =
  /CUSTOMER_AUTH|ADMIN_API|\.env|قاعدة البيانات|غير مهيّ?أ|Gemini|Prisma|ECONN|Failed to fetch|NetworkError|fetch failed|Internal Server|stack|SQL|sqlite|mysql/i;

/**
 * يعرض رسالة الـ API إن كانت مناسبة للمستخدم، وإلا البديل الآمن.
 */
export function userFacingMessage(
  raw: unknown,
  fallback: string,
): string {
  if (typeof raw !== "string") return fallback;
  const msg = raw.trim();
  if (!msg || TECHNICAL_PATTERN.test(msg)) return fallback;
  return msg;
}

/** لكتل catch — لا تعرض error.message التقني/الإنجليزي */
export function userFacingCatchMessage(
  error: unknown,
  fallback: string = PUBLIC_MSG.connectionFailed,
): string {
  if (!(error instanceof Error)) return fallback;
  return userFacingMessage(error.message, fallback);
}
