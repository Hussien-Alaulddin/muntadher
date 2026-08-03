/**
 * يشغّل prisma db push إذا توفر رابط MySQL.
 * لا يُفشل الـ Deploy عند خطأ اتصال/مصادقة.
 */
require("./load-persistent-env");

const { execSync } = require("child_process");

function resolveMysqlUrl() {
  const candidates = [
    ["MYSQL_DATABASE_URL", process.env.MYSQL_DATABASE_URL],
    ["HOSTINGER_DATABASE_URL", process.env.HOSTINGER_DATABASE_URL],
    ["DATABASE_URL", process.env.DATABASE_URL],
  ];
  for (const [name, raw] of candidates) {
    const url = (raw || "").trim();
    if (url.startsWith("mysql://")) return { name, url };
  }
  return null;
}

const resolved = resolveMysqlUrl();

if (!resolved) {
  console.warn(
    "[db-push-safe] تخطي prisma db push — لا يوجد رابط mysql://",
  );
  process.exit(0);
}

process.env.DATABASE_URL = resolved.url;
try {
  const parsed = new URL(resolved.url);
  console.log(
    `[db-push-safe] المصدر=${resolved.name} user=${parsed.username} host=${parsed.hostname} db=${parsed.pathname.replace(/^\//, "")} passLen=${parsed.password.length}`,
  );
} catch {
  /* ignore */
}

console.log("[db-push-safe] تشغيل prisma db push على MySQL…");

try {
  execSync("npx prisma db push", { stdio: "inherit", env: process.env });
} catch {
  console.warn(
    "[db-push-safe] فشل db push — سيتم متابعة البناء. أصلح بيانات MySQL ثم أعد النشر.",
  );
  console.warn(
    "[db-push-safe] تحقق: phpMyAdmin بنفس user/password. إن نجح هناك وفشل هنا غالباً الرابط في البيئة مختلف.",
  );
  process.exit(0);
}
