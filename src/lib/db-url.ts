/**
 * تطبيع روابط قواعد البيانات لـ Prisma.
 * - MySQL (Hostinger): connection_limit مناسب، بدون فرض SSL على localhost
 * - Postgres (ترحيل/قديم): sslmode و connect_timeout كما كان مع Supabase
 */
export function normalizeDatabaseUrl(
  raw: string | undefined | null,
): string | null {
  if (!raw?.trim()) return null;

  try {
    const url = new URL(raw);
    const protocol = url.protocol.replace(":", "").toLowerCase();
    const isMysql =
      protocol === "mysql" ||
      protocol === "mysqls" ||
      protocol.startsWith("mysql");

    if (isMysql) {
      url.searchParams.set("connection_limit", "5");
      url.searchParams.set("pool_timeout", "30");
      url.searchParams.set("connect_timeout", "30");

      const host = url.hostname.toLowerCase();
      const isLocal =
        host === "localhost" || host === "127.0.0.1" || host === "::1";
      if (!isLocal && !url.searchParams.has("sslmode")) {
        // بعض اتصالات Hostinger عن بُعد قد تتطلب SSL — يُضبط يدوياً عند الحاجة
      }
      return url.toString();
    }

    const port = url.port || "5432";

    if (port === "6543") {
      url.searchParams.set("pgbouncer", "true");
    } else {
      url.searchParams.delete("pgbouncer");
    }

    url.searchParams.set("connection_limit", "1");
    url.searchParams.set("pool_timeout", "30");

    if (!url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "require");
    }
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "30");
    }

    return url.toString();
  } catch {
    return raw.trim();
  }
}

export function isDbConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string };
  if (err.code === "P1001" || err.code === "P1017" || err.code === "P1002") {
    return true;
  }
  const message = `${err.message ?? ""}`.toLowerCase();
  return (
    message.includes("can't reach database server") ||
    message.includes("server has closed the connection") ||
    message.includes("connection timed out") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("max clients reached") ||
    message.includes("emaxconnsession") ||
    message.includes("too many connections")
  );
}

/** ترميز كلمة مرور داخل DATABASE_URL (رموز مثل # * >) */
export function encodeDbPassword(password: string): string {
  return encodeURIComponent(password);
}
