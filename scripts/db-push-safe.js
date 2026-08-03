/**
 * يشغّل prisma db push إذا توفر رابط MySQL.
 * لا يُفشل الـ Deploy عند خطأ اتصال/مصادقة — يطبع تحذيراً فقط.
 */
require("./load-persistent-env");

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
  process.exit(0);
}

process.env.DATABASE_URL = url;
console.log("[db-push-safe] تشغيل prisma db push على MySQL…");

try {
  execSync("npx prisma db push", { stdio: "inherit", env: process.env });
} catch (error) {
  console.warn(
    "[db-push-safe] فشل db push — سيتم متابعة البناء. أصلح بيانات MySQL ثم أعد النشر.",
  );
  console.warn(
    "[db-push-safe] تلميح: تجنّب رموز # @ : / ? في كلمة المرور، أو ارمّزها في الرابط.",
  );
  process.exit(0);
}
