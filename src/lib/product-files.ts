export type ProductFileItem = {
  name: string;
  url: string;
};

/** عرض عام — الاسم فقط، بدون URL (التحميل عبر /api/shop/download) */
export type PublicProductFileView = {
  name: string;
};

export function parseProductFiles(value: unknown): ProductFileItem[] {
  if (!Array.isArray(value)) return [];
  const files: ProductFileItem[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const url = typeof item.url === "string" ? item.url.trim() : "";
    if (!name || !url) continue;
    files.push({ name, url });
  }
  return files;
}

/** يحذف الروابط من الحمولة العامة حتى لا تُسرَّب في HTML/RSC */
export function toPublicProductFiles(
  files: Array<{ name: string; url?: string }>,
): PublicProductFileView[] {
  return files.map((file) => ({ name: file.name }));
}

export function isFreePrice(price: string) {
  const normalized = price.trim().toLowerCase();
  return (
    normalized === "مجاني" ||
    normalized === "free" ||
    normalized === "0" ||
    normalized === "$0" ||
    normalized === "0$"
  );
}
