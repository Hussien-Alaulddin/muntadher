/**
 * يفرض استخدام رابط MySQL حتى لو Hostinger أعاد كتابة DATABASE_URL
 * إلى رابط Postgres (مثل ربط Supabase التلقائي).
 */
require("./load-persistent-env");

const { spawnSync } = require("child_process");

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

function logMysqlTarget(source, url) {
  try {
    const parsed = new URL(url);
    console.log(
      `[with-mysql-url] المصدر=${source} user=${parsed.username} host=${parsed.hostname}:${parsed.port || "3306"} db=${parsed.pathname.replace(/^\//, "")} passLen=${parsed.password.length}`,
    );
  } catch (error) {
    console.warn("[with-mysql-url] تعذّر تحليل الرابط:", error.message);
  }
}

const resolved = resolveMysqlUrl();
if (resolved) {
  process.env.DATABASE_URL = resolved.url;
  console.log("[with-mysql-url] تم ضبط DATABASE_URL من رابط MySQL");
  logMysqlTarget(resolved.name, resolved.url);
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
