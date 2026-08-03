import { PrismaClient } from "@prisma/client";
import { isDbConnectionError, normalizeDatabaseUrl } from "@/lib/db-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaUrl: string | undefined;
  prismaRevision: number | undefined;
};

/** يُزاد عند تغيير الـ schema حتى لا يبقى عميل قديم في ذاكرة Next */
const PRISMA_CLIENT_REVISION = 5;

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
const directUrl = normalizeDatabaseUrl(process.env.DIRECT_URL);

export const isDatabaseConfigured = Boolean(databaseUrl);

function createPrismaClient(url: string) {
  return new PrismaClient({
    datasources: {
      db: { url },
    },
    log: process.env.NODE_ENV === "development" ? ["warn"] : ["error"],
  });
}

/**
 * يرجّع عميل Prisma، أو null لو ما تم ضبط DATABASE_URL بعد.
 * الموقع لازم يشتغل قبل ربط قاعدة البيانات، فطبقة المحتوى تتعامل مع null
 * بعرض المحتوى الابتدائي (placeholder) بدل ما تنكسر الصفحة.
 */
export function getPrisma(): PrismaClient | null {
  if (!databaseUrl) return null;

  const cached = globalForPrisma.prisma;
  // بعد prisma generate قد يبقى عميل قديم في globalThis بدون النماذج/الحقول الجديدة
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

/** إعادة إنشاء العميل بعد انقطاع الاتصال */
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

/**
 * تنفيذ استعلام مع إعادة محاولة تلقائية عند أخطاء الشبكة/الاتصال.
 */
export async function withDbRetry<T>(
  operation: (prisma: PrismaClient) => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const prisma = getPrisma();
    if (!prisma) {
      throw new Error("قاعدة البيانات غير مربوطة: اضبط DATABASE_URL");
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

/** رابط مباشر للـ migrations إن وُجد، وإلا نفس DATABASE_URL */
export function getDirectDatabaseUrl() {
  return directUrl ?? databaseUrl;
}
