import { AdminApiError } from "@/lib/admin-api";

/** حذف ملف من تخزين الموقع عبر واجهة الأدمن */
export async function deleteAdminMedia(url: string): Promise<void> {
  const trimmed = url.trim();
  if (!trimmed) return;

  const res = await fetch("/api/admin/upload", {
    method: "DELETE",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: trimmed }),
  });
  const data = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) {
    throw new AdminApiError(data.message ?? `خطأ ${res.status}`, res.status);
  }
}
