import path from "path";

function isSafeRelativeKey(key: string): boolean {
  if (!key || key.includes("\0") || path.isAbsolute(key)) return false;
  if (key.includes("\\") || key.startsWith("/")) return false;
  const parts = key.split("/");
  return parts.every(
    (part) => part.length > 0 && part !== "." && part !== "..",
  );
}

/**
 * جذر التخزين الدائم على Hostinger (خارج مجلد نشر GitHub).
 * مثال: /home/u908955624/media
 *
 * محلياً إن لم يُضبط: public/uploads و storage/private داخل المشروع.
 */
export function getMediaRoot(): string | null {
  const root = process.env.MEDIA_ROOT?.trim();
  return root ? path.resolve(root) : null;
}

/** تفضيل القرص المحلي حتى لو بقيت مفاتيح Supabase في البيئة */
export function preferLocalMediaStorage(): boolean {
  if (getMediaRoot()) return true;
  const driver = process.env.STORAGE_DRIVER?.trim().toLowerCase();
  return driver === "local" || process.env.FORCE_LOCAL_STORAGE === "1";
}

export function publicMediaRootDir(): string {
  const mediaRoot = getMediaRoot();
  if (mediaRoot) return path.join(mediaRoot, "public");
  return path.join(process.cwd(), "public", "uploads");
}

export function privateMediaRootDir(): string {
  const mediaRoot = getMediaRoot();
  if (mediaRoot) return path.join(mediaRoot, "private");
  return path.join(process.cwd(), "storage", "private");
}

export function resolveMediaAbsolutePath(
  rootDir: string,
  objectKey: string,
): string {
  if (!isSafeRelativeKey(objectKey)) {
    throw new Error("مسار ملف غير صالح");
  }
  const root = path.resolve(rootDir);
  const absolute = path.resolve(root, objectKey);
  if (absolute !== root && !absolute.startsWith(root + path.sep)) {
    throw new Error("مسار ملف خارج المجلد المسموح");
  }
  return absolute;
}

/** رابط عام محفوظ في قاعدة البيانات للملفات التسويقية */
export function publicMediaUrlForKey(objectKey: string): string {
  const key = objectKey.split(path.sep).join("/");
  if (getMediaRoot()) {
    return `/api/media/file?key=${encodeURIComponent(key)}`;
  }
  return `/uploads/${key}`;
}

export function privateMediaUrlForKey(objectKey: string): string {
  const key = objectKey.split(path.sep).join("/");
  return `/api/media/local?key=${encodeURIComponent(key)}`;
}
