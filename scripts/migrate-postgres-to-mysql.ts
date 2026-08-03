/**
 * ترحيل من الجهاز المحلي (يحتاج Remote MySQL).
 * على Hostinger استخدم بدلاً منه:
 *   /api/admin/migrate-from-supabase?confirm=1
 */
import { PrismaClient } from "@prisma/client";
import { migratePostgresToMysql } from "../src/lib/migrate-from-postgres";

async function main() {
  const sourceUrl = process.env.SOURCE_DATABASE_URL?.trim();
  if (!sourceUrl?.startsWith("postgres")) {
    throw new Error("SOURCE_DATABASE_URL يجب أن يكون رابط PostgreSQL");
  }

  const prisma = new PrismaClient();
  try {
    const result = await migratePostgresToMysql({
      sourceDatabaseUrl: sourceUrl,
      prisma,
    });
    console.log(result.message);
    console.log(result.imported);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
