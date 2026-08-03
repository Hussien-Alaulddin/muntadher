/**
 * يبني قاعدة SQLite تجريبية محلية من schema.prisma (MySQL للإنتاج).
 * لا يغيّر schema الإنتاج — يولّد prisma/schema.local.prisma فقط.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const sourceSchema = path.join(root, "prisma", "schema.prisma");
const localSchema = path.join(root, "prisma", "schema.local.prisma");
const dbFile = path.join(root, "storage", "local.db");
const databaseUrl = `file:${dbFile}`;

function run(cmd, args, env = {}) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: "inherit",
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function buildLocalSchema(source) {
  let out = source
    .replace(
      /\/\/ قاعدة بيانات منتظر[^\n]*\n(?:\/\/[^\n]*\n)*/,
      "// قاعدة بيانات تجريبية محلية (SQLite) — مولَّدة تلقائياً، لا تعدّلها يدوياً.\n",
    )
    .replace(/provider\s*=\s*"mysql"/, 'provider = "sqlite"')
    .replace(/@db\.Text/g, "")
    // SQLite لا يدعم بعض تعليقات الإنتاج؛ الإبقاء على الباقي كما هو
    ;

  // ثبّت الرابط في الملف كاحتياط؛ CLI يتجاوزه بـ DATABASE_URL
  out = out.replace(
    /url\s*=\s*env\("DATABASE_URL"\)/,
    `url      = env("DATABASE_URL")`,
  );

  return out;
}

fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const source = fs.readFileSync(sourceSchema, "utf8");
fs.writeFileSync(localSchema, buildLocalSchema(source), "utf8");
console.log("[db:local] كُتب", path.relative(root, localSchema));
console.log("[db:local] الملف", path.relative(root, dbFile));

const prismaEnv = {
  DATABASE_URL: databaseUrl,
  MYSQL_DATABASE_URL: "",
  HOSTINGER_DATABASE_URL: "",
};

run("npx", ["prisma", "generate", "--schema", localSchema], prismaEnv);
run("npx", ["prisma", "db", "push", "--schema", localSchema, "--skip-generate"], prismaEnv);
run(
  "npx",
  ["tsx", "prisma/seed.ts"],
  { ...prismaEnv, SEED_DEMO: process.env.SEED_DEMO || "on" },
);

console.log("\n[db:local] جاهز. ضع في .env.local:");
console.log(`DATABASE_URL="${databaseUrl}"`);
console.log('MYSQL_DATABASE_URL=""');
console.log("ثم: npm run dev");
