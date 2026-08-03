import { PrismaClient } from "@prisma/client";
import { isDbConnectionError, normalizeDatabaseUrl } from "@/lib/db-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaUrl: string | undefined;
  prismaRevision: number | undefined;
};

/** يُزاد عند تغيير الـ schema حتى لا يبقى عميل قديم في ذاكرة Next */
const PRISMA_CLIENT_REVISION = 7;

/**
 * Hostinger أحياناً يعيد كتابة DATABASE_URL إلى Postgres (Supabase).
 * نفضّل MYSQL_DATABASE_URL إن وُجد.
 */
function resolveRawDatabaseUrl(): string | null {
  const candidates = [
    process.env.MYSQL_DATABASE_URL,
    process.env.HOSTINGER_DATABASE_URL,
    process.env.DATABASE_URL,
  ];
  for (const raw of candidates) {
    const url = raw?.trim();
    if (url?.startsWith("mysql://")) {
      // ثبّت DATABASE_URL حتى أي كود يقرأه مباشرة يحصل على MySQL
      process.env.DATABASE_URL = url;
      return url;
    }
  }
  return process.env.DATABASE_URL?.trim() || null;
}

function resolvedDatabaseUrl(): string | null {
  return normalizeDatabaseUrl(resolveRawDatabaseUrl());
}

export function isDatabaseConfigured() {
  return Boolean(resolvedDatabaseUrl());
}

function createPrismaClient(url: string) {
  return new PrismaClient({
    datasources: {
      db: { url },
    },
    log: process.env.NODE_ENV === "development" ? ["warn"] : ["error"],
  });
}

/**
 * يرجّع عميل Prisma، أو null لو ما تم ضبط رابط MySQL بعد.
 */
export function getPrisma(): PrismaClient | null {
  const databaseUrl = resolvedDatabaseUrl();
  if (!databaseUrl) return null;

  const cached = globalForPrisma.prisma;
  const stale =
    cached &&
    (globalForPrisma.prismaRevision !== PRISMA_CLIENT_REVISION ||
      typeof (cached as { customer?: unknown }).customer === "undefined" ||
      typeof (cached as { projectFormQuestion?: unknown }).projectFormQuestion ===
        "undefined" ||
      typeof (cached as { newsletterSubscriber?: unknown }).newsletterSubscriber ===
        "undefined");

  if (!cached || stale || globalForPrisma.prismaUrl !== databaseUrl) {
    void cached?.$disconnect().catch(() => undefined);
    globalForPrisma.prisma = createPrismaClient(databaseUrl);
    globalForPrisma.prismaUrl = databaseUrl;
    globalForPrisma.prismaRevision = PRISMA_CLIENT_REVISION;
  }

  return globalForPrisma.prisma ?? null;
}

export async function resetPrisma() {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect().catch(() => undefined);
  }
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaUrl = undefined;
  globalForPrisma.prismaRevision = undefined;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withDbRetry<T>(
  operation: (prisma: PrismaClient) => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const prisma = getPrisma();
    if (!prisma) {
      throw new Error(
        "قاعدة البيانات غير مربوطة: اضبط MYSQL_DATABASE_URL أو DATABASE_URL",
      );
    }

    try {
      return await operation(prisma);
    } catch (error) {
      lastError = error;
      if (!isDbConnectionError(error) || attempt === attempts) {
        throw error;
      }

      console.warn(
        `[prisma] فشل الاتصال (محاولة ${attempt}/${attempts}) — إعادة المحاولة…`,
      );
      await resetPrisma();
      await delay(700 * attempt);
    }
  }

  throw lastError;
}

export function getDirectDatabaseUrl() {
  return (
    normalizeDatabaseUrl(process.env.DIRECT_URL?.trim() || null) ??
    resolvedDatabaseUrl()
  );
}
