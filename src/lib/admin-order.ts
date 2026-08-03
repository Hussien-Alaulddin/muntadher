/** ترتيب العناصر في لوحة التحكم: من 1 إلى عدد العناصر (+1 عند الإضافة) */

export function nextOrderValue(items: Array<unknown>): number {
  return items.length + 1;
}

/** أقصى ترتيب مسموح — عند التعديل = عدد العناصر، عند الإضافة = العدد + 1 */
export function maxOrderValue(
  items: Array<unknown>,
  isNew: boolean,
): number {
  const n = items.length;
  return Math.max(1, isNew ? n + 1 : n);
}

export function clampOrder(value: unknown, max: number): number {
  const n = Number(value);
  const floor = Number.isFinite(n) ? Math.floor(n) : 1;
  const cappedMax = Math.max(1, Math.floor(max));
  return Math.min(Math.max(1, floor || 1), cappedMax);
}
