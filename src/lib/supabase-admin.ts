import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** اسم الـ bucket — من BUCKET_NAME أو SUPABASE_STORAGE_BUCKET، وإلا media */
export function getMediaBucket(): string {
  return (
    process.env.BUCKET_NAME?.trim() ||
    process.env.SUPABASE_STORAGE_BUCKET?.trim() ||
    "media"
  );
}

export function getSupabaseProjectUrl(): string | null {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL.trim().replace(/\/$/, "");
  }

  // استنتاج الرابط من DATABASE_URL: postgres.PROJECT_REF@...
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  try {
    const user = new URL(databaseUrl).username; // postgres.xxxxx
    const ref = user.startsWith("postgres.")
      ? user.slice("postgres.".length)
      : null;
    if (!ref) return null;
    return `https://${ref}.supabase.co`;
  } catch {
    return null;
  }
}

export function isSupabaseStorageConfigured() {
  return Boolean(
    getSupabaseProjectUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = getSupabaseProjectUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function ensureMediaBucket(client: SupabaseClient) {
  const bucket = getMediaBucket();
  const { data: buckets, error } = await client.storage.listBuckets();
  if (error) throw error;
  if (buckets?.some((item) => item.name === bucket)) return;

  const { error: createError } = await client.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 52_428_800, // 50MB
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

/**
 * يستخرج مسار الملف داخل الـ bucket من رابط Supabase (عام أو موقّع).
 * مثال: .../object/public/muntader/products/x.jpg → products/x.jpg
 */
export function storagePathFromPublicUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const buckets = new Set<string>([
      getMediaBucket(),
      process.env.BUCKET_NAME_PRIVATE?.trim() || `${getMediaBucket()}-private`,
    ]);

    for (const bucket of buckets) {
      const markers = [
        `/storage/v1/object/public/${bucket}/`,
        `/storage/v1/object/sign/${bucket}/`,
        `/storage/v1/object/authenticated/${bucket}/`,
      ];
      for (const marker of markers) {
        const index = parsed.pathname.indexOf(marker);
        if (index >= 0) {
          const rest = parsed.pathname.slice(index + marker.length);
          // الروابط الموقّعة قد تتضمن توكن بعد المسار في query فقط — المسار كافٍ
          return decodeURIComponent(rest);
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function deleteStorageObjectByUrl(url: string): Promise<boolean> {
  if (!isSupabaseStorageConfigured()) return false;
  const objectPath = storagePathFromPublicUrl(url);
  if (!objectPath) return false;

  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const {
    bucketForObjectKey,
    getPrivateMediaBucket,
  } = await import("@/lib/media-access");

  const buckets = Array.from(
    new Set([
      bucketForObjectKey(objectPath),
      getMediaBucket(),
      getPrivateMediaBucket(),
    ]),
  );

  for (const bucket of buckets) {
    const { error } = await supabase.storage.from(bucket).remove([objectPath]);
    if (!error) return true;
  }

  console.error("[storage] delete failed for", objectPath);
  return false;
}

/** @deprecated استخدم getMediaBucket() */
export const MEDIA_BUCKET = getMediaBucket();
