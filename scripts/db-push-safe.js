/**
 * يشغّل prisma db push فقط إذا كان DATABASE_URL بصيغة MySQL.
 * يمنع فشل الـ Deploy إذا بقي رابط Postgres بالخطأ في البيئة.
 */
const { execSync } = require("child_process");

const url = (process.env.DATABASE_URL || "").trim();

if (!url.startsWith("mysql://")) {
  console.warn(
    "[db-push-safe] تخطي prisma db push — DATABASE_URL ليس mysql://",
  );
  console.warn(
    "[db-push-safe] القيمة الحالية تبدأ بـ:",
    url ? url.slice(0, 24) + "…" : "(فارغ)",
  );
  process.exit(0);
}

execSync("npx prisma db push", { stdio: "inherit" });
