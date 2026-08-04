/**
 * استعادة المحتوى التجريبي محلياً.
 * التشغيل: npx tsx scripts/restore-demo-content.ts
 */
import { PrismaClient } from "@prisma/client";
import { restoreDemoContent } from "../src/lib/restore-demo-content";

async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await restoreDemoContent(prisma);
    console.log("تمت الاستعادة:", result);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
