import { getPrivateMediaBucket } from "@/lib/media-access";
import { getMediaBucket, getSupabaseProjectUrl } from "@/lib/supabase-admin";

function isAllowedHost(hostname: string): boolean {
  const allowed = new Set<string>();

  const projectUrl = getSupabaseProjectUrl();
  if (projectUrl) {
    try {
      allowed.add(new URL(projectUrl).hostname);
    } catch {
      /* ignore */
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    try {
      allowed.add(new URL(siteUrl).hostname);
    } catch {
      /* ignore */
    }
  }

  if (process.env.NODE_ENV === "development") {
    allowed.add("localhost");
    allowed.add("127.0.0.1");
  }

  return allowed.has(hostname);
}

/**
 * يقبل فقط روابط إيصالات من تخزين الموقع لهذا العميل.
 */
export function isAllowedReceiptImageUrl(
  url: string,
  customerId: string,
): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 2000) return false;

  const prefix = `purchase-receipts/${customerId}/`;

  // مسارات نسبية من نفس التطبيق فقط
  if (!trimmed.includes("://")) {
    if (trimmed.startsWith(`/uploads/${prefix}`)) return true;
    if (
      trimmed.startsWith("/api/media/local?") ||
      trimmed.startsWith("/api/media/file?")
    ) {
      try {
        const key = new URL(trimmed, "http://local.invalid").searchParams.get(
          "key",
        );
        return Boolean(key?.startsWith(prefix) && !key.includes(".."));
      } catch {
        return false;
      }
    }
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  if (!isAllowedHost(parsed.hostname)) return false;

  if (parsed.pathname.startsWith(`/uploads/${prefix}`)) return true;

  if (
    parsed.pathname.startsWith("/api/media/local") ||
    parsed.pathname.startsWith("/api/media/file")
  ) {
    const key = parsed.searchParams.get("key");
    return Boolean(key?.startsWith(prefix) && !key.includes(".."));
  }

  const buckets = [getMediaBucket(), getPrivateMediaBucket()];
  return buckets.some((bucket) => {
    const markers = [
      `/storage/v1/object/public/${bucket}/${prefix}`,
      `/storage/v1/object/sign/${bucket}/${prefix}`,
    ];
    return markers.some((marker) => parsed.pathname.includes(marker));
  });
}

/** روابط صور البروفايل المسموحة فقط من تخزين الموقع لهذا العميل أو Google */
export function isAllowedAvatarUrl(url: string, customerId: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 2000 || !customerId) return false;

  const prefix = `profile-avatars/${customerId}/`;

  if (!trimmed.includes("://")) {
    if (trimmed.startsWith(`/uploads/${prefix}`)) return true;
    if (
      trimmed.startsWith("/api/media/local?") ||
      trimmed.startsWith("/api/media/file?")
    ) {
      try {
        const key = new URL(trimmed, "http://local.invalid").searchParams.get(
          "key",
        );
        return Boolean(key?.startsWith(prefix) && !key.includes(".."));
      } catch {
        return false;
      }
    }
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;

  if (
    parsed.hostname === "lh3.googleusercontent.com" ||
    parsed.hostname.endsWith(".googleusercontent.com")
  ) {
    return true;
  }

  if (!isAllowedHost(parsed.hostname)) return false;

  if (parsed.pathname.startsWith(`/uploads/${prefix}`)) return true;

  if (
    parsed.pathname.startsWith("/api/media/local") ||
    parsed.pathname.startsWith("/api/media/file")
  ) {
    const key = parsed.searchParams.get("key");
    return Boolean(key?.startsWith(prefix) && !key.includes(".."));
  }

  const buckets = [getMediaBucket(), getPrivateMediaBucket()];
  return buckets.some((bucket) => {
    const markers = [
      `/storage/v1/object/public/${bucket}/${prefix}`,
      `/storage/v1/object/sign/${bucket}/${prefix}`,
    ];
    return markers.some((marker) => parsed.pathname.includes(marker));
  });
}
