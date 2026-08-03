import { PrismaClient } from "@prisma/client";
import { Client as PgClient } from "pg";

type Row = Record<string, unknown>;

export const MIGRATE_TABLES: { table: string; model: keyof PrismaClient }[] = [
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

function looksLikeIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}T/.test(value);
}

function normalizeRow(row: Row): Row {
  const out: Row = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) {
      out[key] = value;
    } else if (typeof value === "string" && looksLikeIsoDate(value)) {
      out[key] = new Date(value);
    } else if (Buffer.isBuffer(value)) {
      continue;
    } else {
      out[key] = value;
    }
  }
  return out;
}

export type MigrateResult = {
  ok: boolean;
  message: string;
  imported: Record<string, number>;
};

/**
 * ينقل الصفوف من Postgres (Supabase) إلى MySQL عبر Prisma.
 * يتخطى المكررات (skipDuplicates).
 */
export async function migratePostgresToMysql(options: {
  sourceDatabaseUrl: string;
  prisma: PrismaClient;
}): Promise<MigrateResult> {
  const sourceUrl = options.sourceDatabaseUrl.trim();
  if (!sourceUrl.startsWith("postgres")) {
    throw new Error("SOURCE_DATABASE_URL يجب أن يكون رابط PostgreSQL");
  }

  const pg = new PgClient({
    connectionString: sourceUrl,
    ssl: /supabase|sslmode=require/i.test(sourceUrl)
      ? { rejectUnauthorized: false }
      : undefined,
  });

  await pg.connect();
  const imported: Record<string, number> = {};

  try {
    for (const { table, model } of MIGRATE_TABLES) {
      const result = await pg.query(`SELECT * FROM "${table}"`);
      const rows = (result.rows as Row[]).map(normalizeRow);
      imported[table] = 0;

      if (rows.length === 0) continue;

      const delegate = options.prisma[model] as unknown as {
        createMany: (args: {
          data: Row[];
          skipDuplicates?: boolean;
        }) => Promise<{ count: number }>;
      };

      const chunkSize = 50;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const created = await delegate.createMany({
          data: chunk,
          skipDuplicates: true,
        });
        imported[table] += created.count;
      }
    }
  } finally {
    await pg.end().catch(() => undefined);
  }

  const total = Object.values(imported).reduce((a, b) => a + b, 0);
  return {
    ok: true,
    message: `تم استيراد ${total} صفاً من Supabase إلى MySQL`,
    imported,
  };
}
