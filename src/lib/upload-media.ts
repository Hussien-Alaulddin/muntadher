import type { SupabaseClient } from "@supabase/supabase-js";
import {
  bucketForObjectKey,
  ensurePrivateMediaBucket,
  isPrivateObjectKey,
  storedUrlForUpload,
} from "@/lib/media-access";
import {
  saveLocalPrivateUpload,
  saveLocalUpload,
} from "@/lib/media-upload";
import {
  ensureMediaBucket,
  getSupabaseAdmin,
  isSupabaseStorageConfigured,
} from "@/lib/supabase-admin";

export async function uploadMediaObject(options: {
  objectKey: string;
  bytes: Buffer;
  contentType: string;
  upsert?: boolean;
}): Promise<{ url: string; storage: "supabase" | "local"; bucket: string }> {
  const { objectKey, bytes, contentType, upsert = false } = options;
  const privateObject = isPrivateObjectKey(objectKey);
  const bucket = bucketForObjectKey(objectKey);

  if (isSupabaseStorageConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("إعدادات التخزين غير مكتملة");
    }

    await ensureBucketsForKey(supabase, objectKey);

    const { error } = await supabase.storage.from(bucket).upload(objectKey, bytes, {
      contentType,
      upsert,
    });
    if (error) throw error;

    return {
      url: storedUrlForUpload(objectKey, bucket),
      storage: "supabase",
      bucket,
    };
  }

  const url = privateObject
    ? await saveLocalPrivateUpload(objectKey, bytes)
    : await saveLocalUpload(objectKey, bytes);

  return {
    url,
    storage: "local",
    bucket: privateObject ? "local-private" : "local-public",
  };
}

async function ensureBucketsForKey(
  client: SupabaseClient,
  objectKey: string,
) {
  if (isPrivateObjectKey(objectKey)) {
    await ensurePrivateMediaBucket(client);
  } else {
    await ensureMediaBucket(client);
  }
}
