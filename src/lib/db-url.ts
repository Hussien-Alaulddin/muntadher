/**
 * تطبيع روابط Postgres/Supabase لتقليل انقطاع الاتصال:
 * - sslmode=require
 * - connect_timeout مناسب
 * - connection_limit=1 (مهم مع Prisma + Next.js حتى لا تُستنزف اتصالات Supabase Free)
 * - pgbouncer=true فقط لمنفذ الـ transaction 6543
 */
export function normalizeDatabaseUrl(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null;

  try {
    const url = new URL(raw);
    const port = url.port || "5432";

    if (port === "6543") {
      url.searchParams.set("pgbouncer", "true");
    } else {
      url.searchParams.delete("pgbouncer");
    }

    // Prisma يفتح اتصالاً لكل instance — على Free Session pool الحد صغير (≈15)
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
