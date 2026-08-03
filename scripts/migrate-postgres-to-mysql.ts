/**
 * ترحيل بيانات من Postgres (Supabase) إلى MySQL (Hostinger).
 *
 * الاستخدام:
 *   SOURCE_DATABASE_URL="postgresql://..." \
 *   DATABASE_URL="mysql://..." \
 *   npx tsx scripts/migrate-postgres-to-mysql.ts
 *
 * أو ضع القيم في .env ثم:
 *   npm run db:migrate:from-supabase
 *
 * ملاحظة: يحتاج اتصال MySQL عن بُعد إن شغّلته من جهازك
 * (Remote MySQL في hPanel + IP جهازك).
 */
import { PrismaClient } from "@prisma/client";
import { Client as PgClient } from "pg";

type Row = Record<string, unknown>;

const TABLES: { table: string; model: keyof PrismaClient }[] = [
  { table: "site_settings", model: "siteSettings" },
  { table: "social_links", model: "socialLink" },
  { table: "stats", model: "stat" },
  { table: "projects", model: "project" },
  { table: "products", model: "product" },
  { table: "customers", model: "customer" },
  { table: "featured_banner", model: "featuredBanner" },
  { table: "awards", model: "award" },
  { table: "digital_impact", model: "digitalImpact" },
  { table: "current_tasks", model: "currentTask" },
  { table: "career_highlights", model: "careerHighlight" },
  { table: "client_logos", model: "clientLogo" },
  { table: "testimonials", model: "testimonial" },
  { table: "faqs", model: "faq" },
  { table: "newsletter_subscribers", model: "newsletterSubscriber" },
  { table: "project_form_questions", model: "projectFormQuestion" },
  { table: "project_form_responses", model: "projectFormResponse" },
  { table: "customer_entitlements", model: "customerEntitlement" },
  { table: "cart_items", model: "cartItem" },
  { table: "course_purchase_requests", model: "coursePurchaseRequest" },
];

function normalizeRow(row: Row): Row {
  const out: Row = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) {
      out[key] = value;
    } else if (typeof value === "string" && looksLikeIsoDate(value)) {
      out[key] = new Date(value);
    } else if (Buffer.isBuffer(value)) {
      // Postgres bytea نادر — تجاهل
      continue;
    } else {
      out[key] = value;
    }
  }
  return out;
}

function looksLikeIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}T/.test(value);
}

async function main() {
  const sourceUrl = process.env.SOURCE_DATABASE_URL?.trim();
  const targetUrl = process.env.DATABASE_URL?.trim();

  if (!sourceUrl?.startsWith("postgres")) {
    throw new Error("SOURCE_DATABASE_URL يجب أن يكون رابط PostgreSQL");
  }
  if (!targetUrl?.startsWith("mysql")) {
    throw new Error("DATABASE_URL يجب أن يكون رابط MySQL");
  }

  const pg = new PgClient({
    connectionString: sourceUrl,
    ssl: sourceUrl.includes("supabase")
      ? { rejectUnauthorized: false }
      : undefined,
  });
  await pg.connect();

  const prisma = new PrismaClient();

  console.log("بدء الترحيل Postgres → MySQL…");

  for (const { table, model } of TABLES) {
    const result = await pg.query(`SELECT * FROM "${table}"`);
    const rows = (result.rows as Row[]).map(normalizeRow);
    console.log(`→ ${table}: ${rows.length} صف`);

    if (rows.length === 0) continue;

    const delegate = prisma[model] as unknown as {
      createMany: (args: {
        data: Row[];
        skipDuplicates?: boolean;
      }) => Promise<{ count: number }>;
    };

    // دفعات صغيرة لتفادي حدود حجم الحزمة
    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      await delegate.createMany({ data: chunk, skipDuplicates: true });
    }
  }

  await pg.end();
  await prisma.$disconnect();
  console.log("اكتمل الترحيل.");
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
