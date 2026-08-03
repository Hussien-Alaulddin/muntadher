import type { PrismaClient } from "@prisma/client";

export const REPORT_TYPES = [
  "full",
  "customers",
  "forms",
  "products",
  "content",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export type ReportMeta = {
  id: ReportType;
  title: string;
  description: string;
};

export const REPORT_CATALOG: ReportMeta[] = [
  {
    id: "full",
    title: "التقرير الشامل",
    description: "ملخص تنفيذي لكل مؤشرات الموقع في ملف واحد",
  },
  {
    id: "customers",
    title: "تقرير العملاء",
    description: "التسجيلات، المواقع التقديرية، وصلاحيات التحميل",
  },
  {
    id: "forms",
    title: "تقرير ردود الاستمارة",
    description: "حالات الطلبات، أنواع المساعدة، وأحدث الردود",
  },
  {
    id: "products",
    title: "تقرير المنتجات والتحميلات",
    description: "المنتجات المنشورة وعدّادات التحميل",
  },
  {
    id: "content",
    title: "تقرير المحتوى",
    description: "المشاريع والمنتجات المنشورة على الموقع",
  },
];

export function isReportType(value: string): value is ReportType {
  return (REPORT_TYPES as readonly string[]).includes(value);
}

function asInt(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export type ReportPayload = {
  type: ReportType;
  title: string;
  generatedAt: string;
  summary: Array<{ label: string; value: string }>;
  sections: Array<{
    title: string;
    rows: Array<{ label: string; value: string }>;
  }>;
  tables: Array<{
    title: string;
    headers: string[];
    rows: string[][];
  }>;
};

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function sortByNumericValue(
  rows: Array<{ label: string; value: string }>,
) {
  return [...rows].sort(
    (a, b) =>
      Number(b.value.replace(/,/g, "")) - Number(a.value.replace(/,/g, "")),
  );
}

const STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  closed: "مغلق",
};

function weekStartUtc() {
  const weekStart = new Date();
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  weekStart.setUTCHours(0, 0, 0, 0);
  return weekStart;
}

async function buildCustomersReport(
  db: PrismaClient,
  generatedAt: string,
  limit: number,
): Promise<ReportPayload> {
  const since = weekStartUtc();
  const [total, week, located, byCountry, customers] = await Promise.all([
    db.customer.count(),
    db.customer.count({ where: { createdAt: { gte: since } } }),
    db.customer.count({ where: { country: { not: null } } }),
    db.customer.groupBy({
      by: ["country"],
      where: { country: { not: null } },
      _count: { _all: true },
    }),
    db.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        name: true,
        email: true,
        country: true,
        region: true,
        city: true,
        createdAt: true,
        _count: { select: { entitlements: true } },
      },
    }),
  ]);

  return {
    type: "customers",
    title: "تقرير العملاء",
    generatedAt,
    summary: [
      { label: "إجمالي العملاء", value: formatNumber(total) },
      { label: "تسجيلات آخر 7 أيام", value: formatNumber(week) },
      { label: "بموقع معروف", value: formatNumber(located) },
    ],
    sections: [
      {
        title: "توزيع حسب البلد",
        rows: sortByNumericValue(
          byCountry.map((row) => ({
            label: row.country?.trim() || "غير معروف",
            value: formatNumber(row._count._all),
          })),
        ).slice(0, 12),
      },
    ],
    tables: [
      {
        title: "أحدث العملاء",
        headers: ["الاسم", "البريد", "الموقع", "الكتيبات", "التسجيل"],
        rows: customers.map((c) => [
          c.name,
          c.email,
          [c.region || c.city, c.country].filter(Boolean).join("، ") || "—",
          formatNumber(c._count.entitlements),
          formatDate(c.createdAt),
        ]),
      },
    ],
  };
}

async function buildFormsReport(
  db: PrismaClient,
  generatedAt: string,
  limit: number,
): Promise<ReportPayload> {
  const since = weekStartUtc();
  const [total, week, byStatus, byHelp, forms] = await Promise.all([
    db.projectFormResponse.count(),
    db.projectFormResponse.count({ where: { createdAt: { gte: since } } }),
    db.projectFormResponse.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    db.projectFormResponse.groupBy({
      by: ["helpType"],
      where: { helpType: { not: null } },
      _count: { _all: true },
    }),
    db.projectFormResponse.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        name: true,
        helpType: true,
        status: true,
        contactEmail: true,
        contactWhatsapp: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    type: "forms",
    title: "تقرير ردود الاستمارة",
    generatedAt,
    summary: [
      { label: "إجمالي الردود", value: formatNumber(total) },
      { label: "ردود آخر 7 أيام", value: formatNumber(week) },
      {
        label: "جديدة بانتظار المتابعة",
        value: formatNumber(
          byStatus.find((s) => s.status === "new")?._count._all ?? 0,
        ),
      },
    ],
    sections: [
      {
        title: "حسب الحالة",
        rows: byStatus.map((row) => ({
          label: STATUS_LABELS[row.status] ?? row.status,
          value: formatNumber(row._count._all),
        })),
      },
      {
        title: "حسب نوع المساعدة",
        rows: sortByNumericValue(
          byHelp.map((row) => ({
            label: row.helpType?.trim() || "غير محدد",
            value: formatNumber(row._count._all),
          })),
        ).slice(0, 12),
      },
    ],
    tables: [
      {
        title: "أحدث الردود",
        headers: ["الاسم", "النوع", "الحالة", "التواصل", "التاريخ"],
        rows: forms.map((f) => [
          f.name?.trim() || "—",
          f.helpType?.trim() || "—",
          STATUS_LABELS[f.status] ?? f.status,
          f.contactWhatsapp || f.contactEmail || "—",
          formatDate(f.createdAt),
        ]),
      },
    ],
  };
}

async function buildProductsReport(
  db: PrismaClient,
  generatedAt: string,
  limit: number,
): Promise<ReportPayload> {
  const [products, downloadsAgg, published, core, resource] = await Promise.all(
    [
      db.product.findMany({
        orderBy: { downloadsCount: "desc" },
        take: limit,
        select: {
          title: true,
          type: true,
          group: true,
          price: true,
          published: true,
          downloadsCount: true,
        },
      }),
      db.product.aggregate({ _sum: { downloadsCount: true } }),
      db.product.count({ where: { published: true } }),
      db.product.count({ where: { group: "core" } }),
      db.product.count({ where: { group: "resource" } }),
    ],
  );

  return {
    type: "products",
    title: "تقرير المنتجات والتحميلات",
    generatedAt,
    summary: [
      {
        label: "إجمالي التحميلات",
        value: formatNumber(asInt(downloadsAgg._sum.downloadsCount)),
      },
      { label: "منتجات منشورة", value: formatNumber(published) },
      {
        label: "دورات / موارد",
        value: `${formatNumber(core)} / ${formatNumber(resource)}`,
      },
    ],
    sections: [],
    tables: [
      {
        title: "المنتجات حسب التحميلات",
        headers: ["العنوان", "النوع", "القسم", "السعر", "منشور", "التحميلات"],
        rows: products.map((p) => [
          p.title,
          p.type,
          p.group === "core" ? "دورة" : "مورد",
          p.price,
          p.published ? "نعم" : "لا",
          formatNumber(p.downloadsCount),
        ]),
      },
    ],
  };
}

async function buildContentReport(
  db: PrismaClient,
  generatedAt: string,
  limit = 50,
): Promise<ReportPayload> {
  const [
    projectsTotal,
    projectsPublished,
    productsTotal,
    productsPublished,
    projects,
    products,
  ] = await Promise.all([
    db.project.count(),
    db.project.count({ where: { published: true } }),
    db.product.count(),
    db.product.count({ where: { published: true } }),
    db.project.findMany({
      orderBy: { order: "asc" },
      take: limit,
      select: { title: true, category: true, published: true, slug: true },
    }),
    db.product.findMany({
      orderBy: { order: "asc" },
      take: limit,
      select: {
        title: true,
        type: true,
        group: true,
        published: true,
        slug: true,
      },
    }),
  ]);

  return {
    type: "content",
    title: "تقرير المحتوى",
    generatedAt,
    summary: [
      {
        label: "مشاريع منشورة",
        value: `${formatNumber(projectsPublished)} / ${formatNumber(projectsTotal)}`,
      },
      {
        label: "منتجات منشورة",
        value: `${formatNumber(productsPublished)} / ${formatNumber(productsTotal)}`,
      },
    ],
    sections: [],
    tables: [
      {
        title: "المشاريع",
        headers: ["العنوان", "التصنيف", "المعرّف", "منشور"],
        rows: projects.map((p) => [
          p.title,
          p.category,
          p.slug,
          p.published ? "نعم" : "لا",
        ]),
      },
      {
        title: "المنتجات",
        headers: ["العنوان", "النوع", "القسم", "المعرّف", "منشور"],
        rows: products.map((p) => [
          p.title,
          p.type,
          p.group === "core" ? "دورة" : "مورد",
          p.slug,
          p.published ? "نعم" : "لا",
        ]),
      },
    ],
  };
}

function mergeReports(
  generatedAt: string,
  title: string,
  chunks: ReportPayload[],
): ReportPayload {
  return {
    type: "full",
    title,
    generatedAt,
    summary: chunks.flatMap((chunk) =>
      chunk.summary.map((item) => ({
        label: `${chunk.title}: ${item.label}`,
        value: item.value,
      })),
    ),
    sections: chunks.flatMap((chunk) =>
      chunk.sections.map((section) => ({
        ...section,
        title: `${chunk.title} — ${section.title}`,
      })),
    ),
    tables: chunks.flatMap((chunk) =>
      chunk.tables.map((table) => ({
        ...table,
        title: `${chunk.title} — ${table.title}`,
      })),
    ),
  };
}

export type BuildReportOptions = {
  /** معاينة خفيفة للجداول — أسرع من التصدير الكامل */
  preview?: boolean;
};

export async function buildReportPayload(
  db: PrismaClient,
  type: ReportType,
  options: BuildReportOptions = {},
): Promise<ReportPayload> {
  const generatedAt = new Date().toISOString();
  const meta = REPORT_CATALOG.find((item) => item.id === type)!;
  const preview = Boolean(options.preview);

  const tableLimit = preview ? 12 : 100;
  const fullLimit = preview ? 8 : 25;

  if (type === "customers") {
    return buildCustomersReport(db, generatedAt, tableLimit);
  }
  if (type === "forms") {
    return buildFormsReport(db, generatedAt, tableLimit);
  }
  if (type === "products") {
    return buildProductsReport(db, generatedAt, tableLimit);
  }
  if (type === "content") {
    return buildContentReport(db, generatedAt, preview ? 12 : 50);
  }

  // دفعتان متوازيتان خفيفتان — أسرع من التسلسل الكامل دون إغراق الـ pool
  const [customers, forms] = await Promise.all([
    buildCustomersReport(db, generatedAt, fullLimit),
    buildFormsReport(db, generatedAt, fullLimit),
  ]);
  const [products, content] = await Promise.all([
    buildProductsReport(db, generatedAt, preview ? 8 : 20),
    buildContentReport(db, generatedAt, preview ? 8 : 50),
  ]);

  return mergeReports(generatedAt, meta.title, [
    customers,
    forms,
    products,
    content,
  ]);
}

type ReportCacheEntry = { value: ReportPayload; expires: number };
const reportRamCache = new Map<string, ReportCacheEntry>();
const REPORT_RAM_TTL_MS = 60_000;

export function getCachedReport(
  type: ReportType,
  preview: boolean,
): ReportPayload | null {
  const key = `${type}:${preview ? "preview" : "full"}`;
  const hit = reportRamCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    reportRamCache.delete(key);
    return null;
  }
  return hit.value;
}

export function setCachedReport(
  type: ReportType,
  preview: boolean,
  value: ReportPayload,
) {
  const key = `${type}:${preview ? "preview" : "full"}`;
  reportRamCache.set(key, {
    value,
    expires: Date.now() + REPORT_RAM_TTL_MS,
  });
}

export function clearReportCache(type?: ReportType) {
  if (!type) {
    reportRamCache.clear();
    return;
  }
  reportRamCache.delete(`${type}:preview`);
  reportRamCache.delete(`${type}:full`);
}
