import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { MediaKind } from "@/lib/media-kinds";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const FILE_TYPES = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "application/pdf": "pdf",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
};

export function isAllowedMedia(mime: string, accept: MediaKind) {
  if (accept === "image") return IMAGE_TYPES.has(mime);
  if (accept === "video") return VIDEO_TYPES.has(mime);
  if (accept === "file") {
    return FILE_TYPES.has(mime);
  }
  return IMAGE_TYPES.has(mime) || VIDEO_TYPES.has(mime);
}

/** يتحقق من نوع الملف عبر التوقيع السحري — لا يعتمد على Content-Type وحده */
export function sniffMimeFromBytes(bytes: Buffer): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return "image/gif";
  }
  if (
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (bytes.toString("ascii", 4, 8) === "ftyp") {
    return "video/mp4";
  }
  if (
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  ) {
    return "video/webm";
  }
  if (bytes.toString("ascii", 0, 4) === "%PDF") {
    return "application/pdf";
  }
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    return "application/zip";
  }
  return null;
}

export function resolveUploadMime(
  declaredMime: string,
  bytes: Buffer,
  accept: MediaKind,
): string | null {
  const sniffed = sniffMimeFromBytes(bytes);
  if (sniffed && isAllowedMedia(sniffed, accept)) return sniffed;
  // MOV/quicktime غالباً لا يُشم بسهولة — اقبل المعلن إن كان فيديو مسموحاً
  if (
    accept === "video" &&
    declaredMime === "video/quicktime" &&
    isAllowedMedia(declaredMime, accept)
  ) {
    return declaredMime;
  }
  if (!sniffed && isAllowedMedia(declaredMime, accept) && accept === "image") {
    // AVIF وغيره
    if (declaredMime === "image/avif") return declaredMime;
  }
  return sniffed && isAllowedMedia(sniffed, accept) ? sniffed : null;
}

export function maxBytesForMime(mime: string) {
  if (VIDEO_TYPES.has(mime)) return 50 * 1024 * 1024;
  if (FILE_TYPES.has(mime)) return 30 * 1024 * 1024;
  return 10 * 1024 * 1024;
}

export function extensionForMime(mime: string, filename: string) {
  if (EXT_BY_MIME[mime]) return EXT_BY_MIME[mime];
  const fromName = filename.split(".").pop()?.toLowerCase();
  return fromName && fromName.length <= 5 ? fromName : "bin";
}

/** مجلدات رفع الأدمن المسموحة فقط */
export const ADMIN_UPLOAD_FOLDERS = [
  "general",
  "courses",
  "course-watch",
  "course-lessons",
  "course-attachments",
  "instructors",
  "projects",
  "products",
  "products/files",
  "awards",
  "logos",
  "settings",
  "galleries",
] as const;

export function isSafeRelativeKey(key: string): boolean {
  if (!key || key.includes("\0") || path.isAbsolute(key)) return false;
  if (key.includes("\\") || key.startsWith("/")) return false;
  const parts = key.split("/");
  return parts.every(
    (part) => part.length > 0 && part !== "." && part !== "..",
  );
}

export function sanitizeFolder(folder: string) {
  const cleaned = folder
    .trim()
    .replace(/[^a-zA-Z0-9/_-]/g, "")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "");
  if (!cleaned || !isSafeRelativeKey(cleaned)) return "general";
  return cleaned;
}

/** يعيد المجلد بعد التنظيف فقط إن كان في قائمة الأدمن المسموحة */
export function normalizeAdminUploadFolder(folder: string): string | null {
  const cleaned = folder
    .trim()
    .replace(/[^a-zA-Z0-9/_-]/g, "")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "");
  if (!cleaned || !isSafeRelativeKey(cleaned)) return null;
  return (ADMIN_UPLOAD_FOLDERS as readonly string[]).includes(cleaned)
    ? cleaned
    : null;
}

export function buildObjectKey(folder: string, mime: string, filename: string) {
  const ext = extensionForMime(mime, filename);
  const id = randomBytes(6).toString("hex");
  const stamp = Date.now();
  const safeFolder = sanitizeFolder(folder);
  const objectKey = `${safeFolder}/${stamp}-${id}.${ext}`;
  if (!isSafeRelativeKey(objectKey)) {
    throw new Error("مفتاح تخزين غير صالح");
  }
  return objectKey;
}

/** حفظ محلي للملفات التسويقية العامة (MEDIA_ROOT/public أو public/uploads) */
export async function saveLocalUpload(
  objectKey: string,
  bytes: Buffer,
): Promise<string> {
  const {
    publicMediaRootDir,
    publicMediaUrlForKey,
    resolveMediaAbsolutePath,
  } = await import("@/lib/media-paths");
  const absolute = resolveMediaAbsolutePath(publicMediaRootDir(), objectKey);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, bytes);
  return publicMediaUrlForKey(objectKey);
}

/**
 * حفظ محلي خاص — لا يُخدم مباشرة من الويب.
 * الوصول عبر /api/media/local بعد التحقق من الصلاحية.
 */
export async function saveLocalPrivateUpload(
  objectKey: string,
  bytes: Buffer,
): Promise<string> {
  const {
    privateMediaRootDir,
    privateMediaUrlForKey,
    resolveMediaAbsolutePath,
  } = await import("@/lib/media-paths");
  const absolute = resolveMediaAbsolutePath(privateMediaRootDir(), objectKey);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, bytes);
  return privateMediaUrlForKey(objectKey);
}

export type { MediaKind };
