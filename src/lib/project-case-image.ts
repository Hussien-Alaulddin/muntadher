/** مقاس صور دراسة الحالة في صفحة المشروع — مطابقة لبيهانس */
export const PROJECT_CASE_IMAGE = {
  width: 3240,
  height: 1350,
  /** لـ CSS aspect-ratio */
  aspectRatio: "3240 / 1350",
  /** نسبة العرض/الارتفاع */
  ratio: 3240 / 1350,
  /** نص تلميح لوحة التحكم */
  label: "3240 × 1350",
  /** نسبة مسموحة عند الرفع (±2%) */
  tolerance: 0.02,
} as const;

export function isProjectCaseImageSize(
  width: number,
  height: number,
): boolean {
  if (width < 1 || height < 1) return false;
  const ratio = width / height;
  const expected = PROJECT_CASE_IMAGE.ratio;
  const tol = PROJECT_CASE_IMAGE.tolerance;
  return Math.abs(ratio - expected) <= expected * tol;
}

export function projectCaseImageSizeMessage(width: number, height: number) {
  return `المقاس المطلوب ${PROJECT_CASE_IMAGE.label} بكسل (النسبة ${PROJECT_CASE_IMAGE.width}:${PROJECT_CASE_IMAGE.height}). الصورة الحالية ${width} × ${height}.`;
}
