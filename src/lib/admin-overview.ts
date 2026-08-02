import type { PrismaClient } from "@prisma/client";

const STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  closed: "مغلق",
};

type LabelCount = { label: string; count: number };

export type OverviewKpisPayload = {
  generatedAt: string;
  kpis: {
    customers: {
      total: number;
      week: number;
      weekDelta: number;
      located: number;
    };
    forms: {
      total: number;
      week: number;
      weekDelta: number;
      newCount: number;
    };
    downloads: {
      total: number;
      entitlements: number;
      entitlementsWeek: number;
    };
    newsletter: { total: number; week: number };
    content: {
      projectsTotal: number;
      projectsPublished: number;
      productsTotal: number;
      productsPublished: number;
      productsCore: number;
      productsResource: number;
      cartItems: number;
    };
  };
  formStatus: Array<{ status: string; label: string; count: number }>;
};

export type OverviewChartsPayload = {
  activitySeries: Array<{
    day: string;
    label: string;
    customers: number;
    forms: number;
    entitlements: number;
    newsletter: number;
  }>;
  helpTypes: LabelCount[];
  topCountries: LabelCount[];
  topRegions: LabelCount[];
  topProducts: Array<{
    id: string;
    title: string;
    type: string;
    group: string;
    downloadsCount: number;
    published: boolean;
  }>;
  recentCustomers: Array<{
    id: string;
    name: string;
    email: string;
    country: string | null;
    region: string | null;
    city: string | null;
    createdAt: Date;
    _count: { entitlements: number };
  }>;
  recentForms: Array<{
    id: string;
    name: string | null;
    helpType: string | null;
    status: string;
    createdAt: Date;
  }>;
};

export type OverviewFullPayload = OverviewKpisPayload & OverviewChartsPayload;

let ramCache: { value: OverviewFullPayload; expires: number } | null = null;
const RAM_TTL_MS = 45_000;

export function invalidateOverviewCache() {
  ramCache = null;
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function lastNDays(n: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i),
    );
    days.push(dayKey(d));
  }
  return days;
}

function startOfDayUtc(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function formatDayLabel(isoDay: string) {
  const [y, m, d] = isoDay.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("ar", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function delta(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function asInt(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

async function daySeriesBundle(
  db: PrismaClient,
  rangeStart: Date,
): Promise<{
  customers: Map<string, number>;
  forms: Map<string, number>;
  entitlements: Map<string, number>;
  newsletter: Map<string, number>;
}> {
  const rows = await db.$queryRaw<
    Array<{ source: string; day: string; count: number }>
  >`
    SELECT 'customers' AS source,
           to_char(date_trunc('day', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
           COUNT(*)::int AS count
    FROM customers
    WHERE "createdAt" >= ${rangeStart}
    GROUP BY 2
    UNION ALL
    SELECT 'forms',
           to_char(date_trunc('day', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD'),
           COUNT(*)::int
    FROM project_form_responses
    WHERE "createdAt" >= ${rangeStart}
    GROUP BY 2
    UNION ALL
    SELECT 'entitlements',
           to_char(date_trunc('day', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD'),
           COUNT(*)::int
    FROM customer_entitlements
    WHERE "createdAt" >= ${rangeStart}
    GROUP BY 2
    UNION ALL
    SELECT 'newsletter',
           to_char(date_trunc('day', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD'),
           COUNT(*)::int
    FROM newsletter_subscribers
    WHERE "createdAt" >= ${rangeStart}
    GROUP BY 2
  `;

  const customers = new Map<string, number>();
  const forms = new Map<string, number>();
  const entitlements = new Map<string, number>();
  const newsletter = new Map<string, number>();

  for (const row of rows) {
    const count = asInt(row.count);
    const day = String(row.day);
    if (row.source === "customers") customers.set(day, count);
    else if (row.source === "forms") forms.set(day, count);
    else if (row.source === "entitlements") entitlements.set(day, count);
    else if (row.source === "newsletter") newsletter.set(day, count);
  }

  return { customers, forms, entitlements, newsletter };
}

async function buildKpis(
  db: PrismaClient,
  now: Date,
  weekStart: Date,
  prevWeekStart: Date,
): Promise<OverviewKpisPayload> {
  // استعلامان مجمّعان فقط + groupBy للحالات
  const [customerFormStats, shopContentStats, formByStatus] = await Promise.all([
    db.$queryRaw<
      Array<{
        customers_total: number;
        customers_week: number;
        customers_prev: number;
        customers_located: number;
        forms_total: number;
        forms_week: number;
        forms_prev: number;
      }>
    >`
      SELECT
        (SELECT COUNT(*)::int FROM customers) AS customers_total,
        (SELECT COUNT(*)::int FROM customers WHERE "createdAt" >= ${weekStart}) AS customers_week,
        (SELECT COUNT(*)::int FROM customers WHERE "createdAt" >= ${prevWeekStart} AND "createdAt" < ${weekStart}) AS customers_prev,
        (SELECT COUNT(*)::int FROM customers WHERE country IS NOT NULL) AS customers_located,
        (SELECT COUNT(*)::int FROM project_form_responses) AS forms_total,
        (SELECT COUNT(*)::int FROM project_form_responses WHERE "createdAt" >= ${weekStart}) AS forms_week,
        (SELECT COUNT(*)::int FROM project_form_responses WHERE "createdAt" >= ${prevWeekStart} AND "createdAt" < ${weekStart}) AS forms_prev
    `,
    db.$queryRaw<
      Array<{
        newsletter_total: number;
        newsletter_week: number;
        entitlements_total: number;
        entitlements_week: number;
        cart_items: number;
        downloads_total: number;
        projects_total: number;
        projects_published: number;
        products_total: number;
        products_published: number;
        products_core: number;
        products_resource: number;
      }>
    >`
      SELECT
        (SELECT COUNT(*)::int FROM newsletter_subscribers) AS newsletter_total,
        (SELECT COUNT(*)::int FROM newsletter_subscribers WHERE "createdAt" >= ${weekStart}) AS newsletter_week,
        (SELECT COUNT(*)::int FROM customer_entitlements) AS entitlements_total,
        (SELECT COUNT(*)::int FROM customer_entitlements WHERE "createdAt" >= ${weekStart}) AS entitlements_week,
        (SELECT COUNT(*)::int FROM cart_items) AS cart_items,
        (SELECT COALESCE(SUM("downloadsCount"), 0)::int FROM products) AS downloads_total,
        (SELECT COUNT(*)::int FROM projects) AS projects_total,
        (SELECT COUNT(*)::int FROM projects WHERE published = true) AS projects_published,
        (SELECT COUNT(*)::int FROM products) AS products_total,
        (SELECT COUNT(*)::int FROM products WHERE published = true) AS products_published,
        (SELECT COUNT(*)::int FROM products WHERE "group" = 'core') AS products_core,
        (SELECT COUNT(*)::int FROM products WHERE "group" = 'resource') AS products_resource
    `,
    db.projectFormResponse.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const cf = customerFormStats[0];
  const sc = shopContentStats[0];

  const formStatus = ["new", "contacted", "closed"].map((status) => {
    const found = formByStatus.find((row) => row.status === status);
    return {
      status,
      label: STATUS_LABELS[status] ?? status,
      count: found?._count._all ?? 0,
    };
  });
  for (const row of formByStatus) {
    if (STATUS_LABELS[row.status]) continue;
    formStatus.push({
      status: row.status,
      label: row.status,
      count: row._count._all,
    });
  }

  return {
    generatedAt: now.toISOString(),
    kpis: {
      customers: {
        total: asInt(cf?.customers_total),
        week: asInt(cf?.customers_week),
        weekDelta: delta(asInt(cf?.customers_week), asInt(cf?.customers_prev)),
        located: asInt(cf?.customers_located),
      },
      forms: {
        total: asInt(cf?.forms_total),
        week: asInt(cf?.forms_week),
        weekDelta: delta(asInt(cf?.forms_week), asInt(cf?.forms_prev)),
        newCount: formStatus.find((item) => item.status === "new")?.count ?? 0,
      },
      downloads: {
        total: asInt(sc?.downloads_total),
        entitlements: asInt(sc?.entitlements_total),
        entitlementsWeek: asInt(sc?.entitlements_week),
      },
      newsletter: {
        total: asInt(sc?.newsletter_total),
        week: asInt(sc?.newsletter_week),
      },
      content: {
        projectsTotal: asInt(sc?.projects_total),
        projectsPublished: asInt(sc?.projects_published),
        productsTotal: asInt(sc?.products_total),
        productsPublished: asInt(sc?.products_published),
        productsCore: asInt(sc?.products_core),
        productsResource: asInt(sc?.products_resource),
        cartItems: asInt(sc?.cart_items),
      },
    },
    formStatus,
  };
}

async function buildCharts(
  db: PrismaClient,
  rangeStart: Date,
): Promise<OverviewChartsPayload> {
  const days30 = lastNDays(30);

  const [series, lists] = await Promise.all([
    daySeriesBundle(db, rangeStart),
    Promise.all([
      db.product.findMany({
        orderBy: { downloadsCount: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          type: true,
          group: true,
          downloadsCount: true,
          published: true,
        },
      }),
      db.customer.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          country: true,
          region: true,
          city: true,
          createdAt: true,
          _count: { select: { entitlements: true } },
        },
      }),
      db.projectFormResponse.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          helpType: true,
          status: true,
          createdAt: true,
        },
      }),
    ]),
  ]);

  const [topProducts, recentCustomers, recentForms] = lists;

  const [helpTypeGroups, countryGroups, regionGroups] = await Promise.all([
    db.projectFormResponse.groupBy({
      by: ["helpType"],
      where: { helpType: { not: null } },
      _count: { _all: true },
    }),
    db.customer.groupBy({
      by: ["country"],
      where: { country: { not: null } },
      _count: { _all: true },
    }),
    db.$queryRaw<Array<{ label: string; count: number }>>`
      SELECT
        CASE
          WHEN COALESCE(NULLIF(TRIM(region), ''), NULLIF(TRIM(city), '')) IS NULL THEN NULL
          WHEN country IS NULL OR TRIM(country) = '' THEN COALESCE(NULLIF(TRIM(region), ''), NULLIF(TRIM(city), ''))
          ELSE COALESCE(NULLIF(TRIM(region), ''), NULLIF(TRIM(city), '')) || ' — ' || TRIM(country)
        END AS label,
        COUNT(*)::int AS count
      FROM customers
      WHERE COALESCE(NULLIF(TRIM(region), ''), NULLIF(TRIM(city), '')) IS NOT NULL
      GROUP BY 1
      ORDER BY count DESC
      LIMIT 8
    `,
  ]);

  const activitySeries = days30.map((day) => ({
    day,
    label: formatDayLabel(day),
    customers: series.customers.get(day) ?? 0,
    forms: series.forms.get(day) ?? 0,
    entitlements: series.entitlements.get(day) ?? 0,
    newsletter: series.newsletter.get(day) ?? 0,
  }));

  const helpTypes = helpTypeGroups
    .map((row) => ({
      label: row.helpType?.trim() || "غير محدد",
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const topCountries = countryGroups
    .map((row) => ({
      label: row.country?.trim() || "غير معروف",
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const topRegions = regionGroups
    .filter((row) => row.label?.trim())
    .map((row) => ({ label: row.label.trim(), count: asInt(row.count) }));

  return {
    activitySeries,
    helpTypes,
    topCountries,
    topRegions,
    topProducts,
    recentCustomers,
    recentForms,
  };
}

export async function buildOverviewFull(
  db: PrismaClient,
  opts?: { bypassCache?: boolean },
): Promise<OverviewFullPayload> {
  if (!opts?.bypassCache && ramCache && ramCache.expires > Date.now()) {
    return ramCache.value;
  }

  const now = new Date();
  const rangeStart = startOfDayUtc(
    new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29),
    ),
  );
  const weekStart = startOfDayUtc(
    new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6),
    ),
  );
  const prevWeekStart = startOfDayUtc(
    new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 13),
    ),
  );

  // تسلسلي لتقليل ضغط الـ pooler
  const kpis = await buildKpis(db, now, weekStart, prevWeekStart);
  const charts = await buildCharts(db, rangeStart);

  const value = { ...kpis, ...charts };
  ramCache = { value, expires: Date.now() + RAM_TTL_MS };
  return value;
}

export async function buildOverviewKpis(
  db: PrismaClient,
): Promise<OverviewKpisPayload> {
  if (ramCache && ramCache.expires > Date.now()) {
    return {
      generatedAt: ramCache.value.generatedAt,
      kpis: ramCache.value.kpis,
      formStatus: ramCache.value.formStatus,
    };
  }

  const now = new Date();
  const weekStart = startOfDayUtc(
    new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6),
    ),
  );
  const prevWeekStart = startOfDayUtc(
    new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 13),
    ),
  );
  return buildKpis(db, now, weekStart, prevWeekStart);
}

export async function buildOverviewCharts(
  db: PrismaClient,
): Promise<OverviewChartsPayload> {
  const full = await buildOverviewFull(db);
  return {
    activitySeries: full.activitySeries,
    helpTypes: full.helpTypes,
    topCountries: full.topCountries,
    topRegions: full.topRegions,
    topProducts: full.topProducts,
    recentCustomers: full.recentCustomers,
    recentForms: full.recentForms,
  };
}
