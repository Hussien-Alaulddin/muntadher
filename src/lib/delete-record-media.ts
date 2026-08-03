import { deleteStorageObjectByUrl } from "@/lib/supabase-admin";

/** روابط تخزين يديرها الموقع فقط — لا تُمس الروابط الخارجية */
export function isManagedMediaUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (
    trimmed.startsWith("/api/media/file?") ||
    trimmed.startsWith("/api/media/local?") ||
    trimmed.startsWith("/uploads/")
  ) {
    return true;
  }
  return trimmed.includes("/storage/v1/object/");
}

/** يجمع كل روابط الميديا المُدارة من كائن/مصفوفة/JSON متداخل */
export function collectManagedMediaUrls(value: unknown): string[] {
  const found = new Set<string>();

  function walk(node: unknown) {
    if (node == null) return;
    if (typeof node === "string") {
      if (isManagedMediaUrl(node)) found.add(node.trim());
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (typeof node === "object") {
      for (const child of Object.values(node as Record<string, unknown>)) {
        walk(child);
      }
    }
  }

  walk(value);
  return [...found];
}

export async function deleteManagedMediaUrls(
  urls: Iterable<string>,
): Promise<void> {
  const unique = [...new Set([...urls].map((u) => u.trim()).filter(Boolean))];
  await Promise.all(
    unique.map(async (url) => {
      try {
        await deleteStorageObjectByUrl(url);
      } catch (error) {
        console.error("[media] delete failed", url, error);
      }
    }),
  );
}

/** يحذف الملفات التي كانت في السجل القديم واختفت بعد التحديث */
export async function deleteRemovedManagedMedia(
  before: unknown,
  after: unknown,
): Promise<void> {
  const beforeUrls = new Set(collectManagedMediaUrls(before));
  const afterUrls = new Set(collectManagedMediaUrls(after));
  const removed = [...beforeUrls].filter((url) => !afterUrls.has(url));
  if (removed.length === 0) return;
  await deleteManagedMediaUrls(removed);
}
