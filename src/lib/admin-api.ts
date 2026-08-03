import {
  deleteAdminCache,
  getInflight,
  invalidateAdminCache,
  peekAdminCache,
  setAdminCache,
  setInflight,
} from "@/lib/admin-cache";
import { invalidateOverviewCache } from "@/lib/admin-overview";

export class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string };
    return data.message ?? `خطأ ${res.status}`;
  } catch {
    return `خطأ ${res.status}`;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    if (
      res.status === 401 &&
      typeof window !== "undefined" &&
      !path.startsWith("/api/admin/auth")
    ) {
      const here = window.location.pathname;
      if (here.startsWith("/admin") && here !== "/admin/login") {
        const login = new URL("/admin/login", window.location.origin);
        login.searchParams.set("next", here);
        window.location.replace(login.toString());
        return new Promise<T>(() => {});
      }
    }
    throw new AdminApiError(await parseError(res), res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** إبطال الكاش المرتبط بالتعديل فقط — لا تمسح كل اللوحة */
export function invalidateRelatedAdminCache(mutatedPath: string) {
  const clean = mutatedPath.split("?")[0].replace(/\/$/, "");
  const collectionMatch = clean.match(/^(\/api\/admin\/[^/]+)/);
  if (collectionMatch) {
    invalidateAdminCache(collectionMatch[1]);
  } else {
    invalidateAdminCache(clean);
  }

  invalidateAdminCache("/api/admin/overview");
  invalidateOverviewCache();

  if (
    clean.includes("/customers") ||
    clean.includes("/form-responses") ||
    clean.includes("/auth")
  ) {
    invalidateAdminCache("/api/admin/notifications");
  }
}

/**
 * جلب بيانات اللوحة مع كاش عميل وdedupe للطلبات المتزامنة.
 * بعد أي تعديل يُفرَّغ الكاش المرتبط فقط.
 * مرّر bypassCache: true لإجبار إعادة الجلب (زر التحديث).
 */
export async function adminFetch<T>(
  path: string,
  init?: RequestInit & { bypassCache?: boolean },
): Promise<T> {
  const { bypassCache, ...fetchInit } = init ?? {};
  const method = (fetchInit.method ?? "GET").toUpperCase();

  if (method === "GET") {
    if (bypassCache) {
      deleteAdminCache(path);
    } else {
      const cached = peekAdminCache<T>(path);
      if (cached !== null) return cached;

      const pending = getInflight<T>(path);
      if (pending) return pending;
    }

    const promise = request<T>(path, fetchInit).then((data) => {
      setAdminCache(path, data);
      return data;
    });
    setInflight(path, promise);
    return promise;
  }

  const data = await request<T>(path, fetchInit);
  invalidateRelatedAdminCache(path);
  return data;
}

/** تفضيل مسبق لمسار API (عند المرور على رابط القائمة) */
export function prefetchAdmin(path: string) {
  if (peekAdminCache(path) !== null) return;
  void adminFetch(path).catch(() => {});
}

/** تفضيل خفيف عند فتح اللوحة — بدون ضرب كل الأقسام دفعة واحدة */
export function prefetchAdminNav() {
  prefetchAdmin("/api/admin/overview?part=kpis");
  prefetchAdmin("/api/admin/notifications");
}
