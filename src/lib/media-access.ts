import { createReadStream, existsSync } from "fs";
import path from "path";
import { Readable } from "stream";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getMediaBucket,
  getSupabaseAdmin,
  getSupabaseProjectUrl,
  isSupabaseStorageConfigured,
  storagePathFromPublicUrl,
} from "@/lib/supabase-admin";

/** مجلدات حساسة — لا تُعرض بروابط عامة مباشرة */
export const PRIVATE_FOLDER_PREFIXES = [
  "purchase-receipts/",
  "course-lessons/",
  "course-attachments/",
  "products/files/",
] as const;

export const DEFAULT_SIGNED_URL_SECONDS = 60 * 60 * 2; // ساعتان
export const DOWNLOAD_SIGNED_URL_SECONDS = 60 * 10; // 10 دقائق
export const RECEIPT_SIGNED_URL_SECONDS = 60 * 30;

export function getPrivateMediaBucket(): string {
  return (
    process.env.BUCKET_NAME_PRIVATE?.trim() ||
    `${getMediaBucket()}-private`
  );
}

export function isPrivateObjectKey(objectKey: string): boolean {
  const key = objectKey.replace(/^\/+/, "");
  return PRIVATE_FOLDER_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export function bucketForObjectKey(objectKey: string): string {
  return isPrivateObjectKey(objectKey) ? getPrivateMediaBucket() : getMediaBucket();
}

export type ResolvedMediaRef = {
  objectKey: string;
  bucket: string;
  isPrivate: boolean;
  /** رفع محلي خاص خارج public/ */
  localPrivate: boolean;
  /** مسار محلي عام /uploads/... */
  localPublic: boolean;
};

/**
 * يستخرج مرجع التخزين من رابط محفوظ أو مفتاح كائن.
 * يدعم: Supabase public/sign، /uploads/، /api/media/local?key=
 */
export function resolveMediaRef(urlOrKey: string): ResolvedMediaRef | null {
  const raw = urlOrKey.trim();
  if (!raw) return null;

  if (raw.startsWith("/api/media/local?")) {
    try {
      const key = new URL(raw, "http://local.invalid").searchParams.get("key");
      if (!key || key.includes("..")) return null;
      const objectKey = key.replace(/^\/+/, "");
      return {
        objectKey,
        bucket: bucketForObjectKey(objectKey),
        isPrivate: isPrivateObjectKey(objectKey),
        localPrivate: true,
        localPublic: false,
      };
    } catch {
      return null;
    }
  }

  if (raw.startsWith("/uploads/")) {
    const objectKey = raw.slice("/uploads/".length).replace(/^\/+/, "");
    if (!objectKey || objectKey.includes("..")) return null;
    return {
      objectKey,
      bucket: bucketForObjectKey(objectKey),
      isPrivate: isPrivateObjectKey(objectKey),
      localPrivate: isPrivateObjectKey(objectKey),
      localPublic: !isPrivateObjectKey(objectKey),
    };
  }

  // مفتاح كائن مباشر
  if (!raw.includes("://") && !raw.startsWith("/")) {
    const objectKey = raw.replace(/^\/+/, "");
    if (!objectKey || objectKey.includes("..")) return null;
    return {
      objectKey,
      bucket: bucketForObjectKey(objectKey),
      isPrivate: isPrivateObjectKey(objectKey),
      localPrivate: false,
      localPublic: false,
    };
  }

  const fromUrl = storagePathFromPublicUrl(raw);
  if (fromUrl) {
    // حدّد الـ bucket من الرابط إن وُجد
    let bucket = bucketForObjectKey(fromUrl);
    try {
      const parsed = new URL(raw);
      const privateBucket = getPrivateMediaBucket();
      const publicBucket = getMediaBucket();
      if (parsed.pathname.includes(`/object/public/${privateBucket}/`)) {
        bucket = privateBucket;
      } else if (parsed.pathname.includes(`/object/sign/${privateBucket}/`)) {
        bucket = privateBucket;
      } else if (parsed.pathname.includes(`/object/public/${publicBucket}/`)) {
        bucket = isPrivateObjectKey(fromUrl) ? privateBucket : publicBucket;
      }
    } catch {
      /* ignore */
    }

    return {
      objectKey: fromUrl,
      bucket,
      isPrivate: isPrivateObjectKey(fromUrl) || bucket === getPrivateMediaBucket(),
      localPrivate: false,
      localPublic: false,
    };
  }

  return null;
}

export async function ensurePrivateMediaBucket(client: SupabaseClient) {
  const bucket = getPrivateMediaBucket();
  const { data: buckets, error } = await client.storage.listBuckets();
  if (error) throw error;
  if (buckets?.some((item) => item.name === bucket)) {
    // تأكد أنه غير عام
    await client.storage.updateBucket(bucket, {
      public: false,
      fileSizeLimit: 52_428_800,
    });
    return;
  }

  const { error: createError } = await client.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: 52_428_800,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "application/pdf",
      "application/zip",
    ],
  });
  if (createError && !/already exists/i.test(createError.message)) {
    throw createError;
  }
}

/** رابط للتخزين في قاعدة البيانات بعد الرفع */
export function storedUrlForUpload(objectKey: string, bucket: string): string {
  if (!isSupabaseStorageConfigured()) {
    if (isPrivateObjectKey(objectKey)) {
      return `/api/media/local?key=${encodeURIComponent(objectKey)}`;
    }
    return `/uploads/${objectKey}`;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return isPrivateObjectKey(objectKey)
      ? `/api/media/local?key=${encodeURIComponent(objectKey)}`
      : `/uploads/${objectKey}`;
  }

  // حتى للملفات الخاصة: نحفظ شكل URL قابل لاستخراج المسار (لا يُعتمد عليه للوصول المباشر)
  const { data } = supabase.storage.from(bucket).getPublicUrl(objectKey);
  return data.publicUrl;
}

export async function createSignedMediaUrl(
  urlOrKey: string,
  expiresIn = DEFAULT_SIGNED_URL_SECONDS,
): Promise<string | null> {
  const ref = resolveMediaRef(urlOrKey);
  if (!ref) {
    // رابط خارجي (YouTube / رابط يدوي) — أرجعه كما هو
    if (urlOrKey.startsWith("http://") || urlOrKey.startsWith("https://")) {
      return urlOrKey;
    }
    return null;
  }

  if (ref.localPublic) {
    return `/uploads/${ref.objectKey}`;
  }

  if (ref.localPrivate || (ref.isPrivate && !isSupabaseStorageConfigured())) {
    const { createSignedLocalMediaUrl } = await import("@/lib/media-local-sign");
    return (
      createSignedLocalMediaUrl({
        objectKey: ref.objectKey,
        expiresInSeconds: expiresIn,
      }) || `/api/media/local?key=${encodeURIComponent(ref.objectKey)}`
    );
  }

  if (!isSupabaseStorageConfigured()) return null;
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  // جرّب الـ bucket المحسوب، ثم العام للملفات القديمة
  const bucketsToTry = [ref.bucket];
  const publicBucket = getMediaBucket();
  const privateBucket = getPrivateMediaBucket();
  if (ref.isPrivate && !bucketsToTry.includes(publicBucket)) {
    bucketsToTry.push(publicBucket);
  }
  if (!bucketsToTry.includes(privateBucket) && ref.isPrivate) {
    bucketsToTry.push(privateBucket);
  }

  for (const bucket of bucketsToTry) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(ref.objectKey, expiresIn);
    if (!error && data?.signedUrl) return data.signedUrl;
  }

  // ملف تسويقي عام قديم
  if (!ref.isPrivate) {
    const project = getSupabaseProjectUrl();
    if (project) {
      return `${project}/storage/v1/object/public/${publicBucket}/${ref.objectKey}`;
    }
  }

  return null;
}

export function localPrivateAbsolutePath(objectKey: string) {
  const key = objectKey.replace(/\\/g, "/").replace(/^\/+/, "");
  if (
    !key ||
    key.includes("\0") ||
    key.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    throw new Error("مسار ملف غير صالح");
  }
  const root = path.resolve(process.cwd(), "storage", "private");
  const absolute = path.resolve(root, key);
  if (absolute !== root && !absolute.startsWith(root + path.sep)) {
    throw new Error("مسار ملف خارج المجلد المسموح");
  }
  return absolute;
}

export function localPrivateFileExists(objectKey: string) {
  try {
    return existsSync(localPrivateAbsolutePath(objectKey));
  } catch {
    return false;
  }
}

export function openLocalPrivateReadStream(objectKey: string) {
  try {
    const absolute = localPrivateAbsolutePath(objectKey);
    if (!existsSync(absolute)) return null;
    return createReadStream(absolute);
  } catch {
    return null;
  }
}

export function nodeStreamToWeb(stream: ReturnType<typeof createReadStream>) {
  return Readable.toWeb(stream) as unknown as ReadableStream;
}
