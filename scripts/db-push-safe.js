/**
 * يشغّل prisma db push إذا توفر رابط MySQL
 * (MYSQL_DATABASE_URL أو DATABASE_URL).
 */
const { execSync } = require("child_process");

function resolveMysqlUrl() {
  const candidates = [
    process.env.MYSQL_DATABASE_URL,
    process.env.HOSTINGER_DATABASE_URL,
    process.env.DATABASE_URL,
  ];
  for (const raw of candidates) {
    const url = (raw || "").trim();
    if (url.startsWith("mysql://")) return url;
  }
  return null;
}

const url = resolveMysqlUrl();

if (!url) {
  console.warn(
    "[db-push-safe] تخطي prisma db push — لا يوجد رابط mysql://",
  );
  console.warn(
    "[db-push-safe] DATABASE_URL الحالي يبدأ بـ:",
    (process.env.DATABASE_URL || "").slice(0, 24) || "(فارغ)",
    "…",
  );
  console.warn(
    "[db-push-safe] أضف MYSQL_DATABASE_URL=mysql://... في متغيرات البيئة",
  );
  process.exit(0);
}

process.env.DATABASE_URL = url;
console.log("[db-push-safe] تشغيل prisma db push على MySQL…");
execSync("npx prisma db push", { stdio: "inherit", env: process.env });
