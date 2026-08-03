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
  found?: Record<string, number>;
  mysqlCounts?: Record<string, number>;
  sourceTables?: string[];
};

async function countMysqlRows(
  prisma: PrismaClient,
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const { model, table } of MIGRATE_TABLES) {
    try {
      const delegate = prisma[model] as unknown as {
        count: () => Promise<number>;
      };
      counts[table] = await delegate.count();
    } catch {
      counts[table] = -1;
    }
  }
  return counts;
}

/**
 * ينقل الصفوف من Postgres (Supabase) إلى MySQL عبر Prisma.
 * يتخطى المكررات (skipDuplicates).
 */
export async function migratePostgresToMysql(options: {
  sourceDatabaseUrl: string;
  prisma: PrismaClient;
  diagnoseOnly?: boolean;
}): Promise<MigrateResult> {
  const sourceUrl = options.sourceDatabaseUrl.trim();
  if (!sourceUrl.startsWith("postgres")) {
    throw new Error("SOURCE_DATABASE_URL يجب أن يكون رابط PostgreSQL");
  }

  // Hostinger غالباً يعترض سلسلة شهادات SSL نحو Supabase
  let connectionString = sourceUrl;
  try {
    const parsed = new URL(sourceUrl);
    parsed.searchParams.delete("sslmode");
    connectionString = parsed.toString();
  } catch {
    /* ignore */
  }

  const pg = new PgClient({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  await pg.connect();
  const imported: Record<string, number> = {};
  const found: Record<string, number> = {};

  try {
    const listed = await pg.query<{ tablename: string }>(
      `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
    );
    const sourceTables = listed.rows.map((r) => r.tablename);

    for (const { table, model } of MIGRATE_TABLES) {
      imported[table] = 0;
      found[table] = 0;

      const tableExists = sourceTables.includes(table);
      if (!tableExists) continue;

      const result = await pg.query(`SELECT * FROM "${table}"`);
      const rows = (result.rows as Row[]).map(normalizeRow);
      found[table] = rows.length;

      if (options.diagnoseOnly || rows.length === 0) continue;

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

    const mysqlCounts = await countMysqlRows(options.prisma);
    const foundTotal = Object.values(found).reduce((a, b) => a + b, 0);
    const importedTotal = Object.values(imported).reduce((a, b) => a + b, 0);

    if (options.diagnoseOnly) {
      return {
        ok: true,
        message: `تشخيص: Supabase فيه ${foundTotal} صف، MySQL فيه ${Object.values(mysqlCounts).reduce((a, b) => a + b, 0)} صف`,
        imported,
        found,
        mysqlCounts,
        sourceTables,
      };
    }

    return {
      ok: true,
      message:
        foundTotal === 0
          ? "Supabase فارغ أو الجداول غير موجودة في المصدر — لم يُستورد شيء"
          : importedTotal === 0
            ? `وُجد ${foundTotal} صف في Supabase لكن لم يُدرج جديد (غالباً موجود مسبقاً في MySQL)`
            : `تم استيراد ${importedTotal} صفاً من أصل ${foundTotal}`,
      imported,
      found,
      mysqlCounts,
      sourceTables,
    };
  } finally {
    await pg.end().catch(() => undefined);
  }
}
