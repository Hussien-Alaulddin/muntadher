import { resolveMediaRef } from "@/lib/media-access";
import { parseProductFiles } from "@/lib/product-files";
import type { PrismaClient } from "@prisma/client";

function collectUrls(value: unknown, out: Set<string>) {
  if (!value) return;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) out.add(trimmed);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectUrls(item, out);
    return;
  }
  if (typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) {
      collectUrls(item, out);
    }
  }
}

function urlMatchesObjectKey(url: string, objectKey: string): boolean {
  if (url === objectKey) return true;
  const ref = resolveMediaRef(url);
  return ref?.objectKey === objectKey;
}

/** هل الملف مرتبط فعلياً بهذا المنتج (courseWatch / files)؟ */
export async function mediaObjectBelongsToProduct(
  prisma: PrismaClient,
  productId: string,
  objectKey: string,
): Promise<boolean> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { files: true, courseWatch: true, courseDetail: true },
  });
  if (!product) return false;

  const urls = new Set<string>();
  for (const file of parseProductFiles(product.files)) {
    urls.add(file.url);
  }
  collectUrls(product.courseWatch, urls);
  collectUrls(product.courseDetail, urls);

  for (const url of urls) {
    if (urlMatchesObjectKey(url, objectKey)) return true;
  }
  return false;
}
