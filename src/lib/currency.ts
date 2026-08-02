/** عملة الموقع الافتراضية: الدينار العراقي */
export const SITE_CURRENCY_LABEL = "د.ع";

/** يعرض السعر بصيغة الدينار العراقي */
export function formatSitePrice(price: string | null | undefined): string {
  const raw = (price ?? "").trim();
  if (!raw) return raw;

  if (/مجاني|قريبا|قريبًا|soon|free/i.test(raw)) {
    return raw.replace(/\$|USD/gi, "").trim() || raw;
  }

  if (/د\.?\s*ع|دينار|IQD/i.test(raw)) {
    return raw.replace(/\$|USD/gi, "").trim();
  }

  const withoutSymbol = raw.replace(/\$|USD/gi, "").trim();
  if (!withoutSymbol) return SITE_CURRENCY_LABEL;

  // إذا كان الرقم فقط أو مع رموز أخرى نضيف د.ع
  return `${withoutSymbol} ${SITE_CURRENCY_LABEL}`;
}
