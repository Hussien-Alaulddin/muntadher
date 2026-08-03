/**
 * يفرض استخدام رابط MySQL حتى لو Hostinger أعاد كتابة DATABASE_URL
 * إلى رابط Postgres (مثل ربط Supabase التلقائي).
 *
 * الأولوية:
 * 1) MYSQL_DATABASE_URL
 * 2) HOSTINGER_DATABASE_URL
 * 3) DATABASE_URL إن كان mysql://
 *
 * الاستخدام:
 *   node scripts/with-mysql-url.js prisma generate
 *   node scripts/with-mysql-url.js next build
 */
require("./load-persistent-env");

const { spawnSync } = require("child_process");

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

const mysqlUrl = resolveMysqlUrl();
if (mysqlUrl) {
  process.env.DATABASE_URL = mysqlUrl;
  console.log("[with-mysql-url] تم ضبط DATABASE_URL من رابط MySQL");
} else {
  console.warn(
    "[with-mysql-url] لا يوجد MYSQL_DATABASE_URL / رابط mysql:// صالح",
  );
}

const args = process.argv.slice(2);
if (!args.length) process.exit(0);

const result = spawnSync(args.join(" "), {
  stdio: "inherit",
  env: process.env,
  shell: true,
});
process.exit(result.status ?? 1);
