"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRightIcon,
  ArrowLeftIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  ClipboardListIcon,
  DownloadIcon,
  FolderKanbanIcon,
  GraduationCapIcon,
  MailIcon,
  RefreshCwIcon,
  ShoppingBagIcon,
  UsersIcon,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { invalidateAdminCache, peekAdminCache, setAdminCache } from "@/lib/admin-cache";
import { AdminPageHeader } from "@/components/admin/admin-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type OverviewData = {
  generatedAt: string;
  kpis: {
    customers: { total: number; week: number; weekDelta: number; located: number };
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
  activitySeries: Array<{
    day: string;
    label: string;
    customers: number;
    forms: number;
    entitlements: number;
    newsletter: number;
  }>;
  formStatus: Array<{ status: string; label: string; count: number }>;
  helpTypes: Array<{ label: string; count: number }>;
  topCountries: Array<{ label: string; count: number }>;
  topRegions: Array<{ label: string; count: number }>;
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
    country?: string | null;
    region?: string | null;
    city?: string | null;
    createdAt: string;
    _count: { entitlements: number };
  }>;
  recentForms: Array<{
    id: string;
    name: string | null;
    helpType: string | null;
    status: string;
    createdAt: string;
  }>;
};

const OVERVIEW_PATH = "/api/admin/overview";
const OVERVIEW_KPI_PATH = "/api/admin/overview?part=kpis";
const OVERVIEW_CHARTS_PATH = "/api/admin/overview?part=charts";

const EMPTY_CHARTS: Pick<
  OverviewData,
  | "activitySeries"
  | "helpTypes"
  | "topCountries"
  | "topRegions"
  | "topProducts"
  | "recentCustomers"
  | "recentForms"
> = {
  activitySeries: [],
  helpTypes: [],
  topCountries: [],
  topRegions: [],
  topProducts: [],
  recentCustomers: [],
  recentForms: [],
};

const activityConfig = {
  customers: { label: "عملاء جدد", color: "var(--chart-1)" },
  forms: { label: "ردود استمارة", color: "var(--chart-2)" },
  entitlements: { label: "صلاحيات تحميل", color: "var(--chart-3)" },
} satisfies ChartConfig;

const statusConfig = {
  new: { label: "جديد", color: "var(--chart-1)" },
  contacted: { label: "تم التواصل", color: "var(--chart-2)" },
  closed: { label: "مغلق", color: "var(--chart-4)" },
  other: { label: "أخرى", color: "var(--chart-5)" },
} satisfies ChartConfig;

const downloadsConfig = {
  downloads: { label: "تحميلات", color: "var(--chart-1)" },
} satisfies ChartConfig;

const helpConfig = {
  count: { label: "العدد", color: "var(--chart-2)" },
} satisfies ChartConfig;

const geoConfig = {
  count: { label: "عملاء", color: "var(--chart-1)" },
} satisfies ChartConfig;

const STATUS_BADGE: Record<string, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  closed: "مغلق",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function DeltaBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <Badge variant="secondary" className="font-normal">
        ثابت عن الأسبوع السابق
      </Badge>
    );
  }
  const up = value > 0;
  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1 font-normal",
        up
          ? "bg-emerald-500/10 text-emerald-700"
          : "bg-rose-500/10 text-rose-700",
      )}
    >
      {up ? (
        <ArrowUpRightIcon className="size-3.5" />
      ) : (
        <ArrowDownRightIcon className="size-3.5" />
      )}
      {up ? "+" : ""}
      {formatNumber(value)}% عن الأسبوع السابق
    </Badge>
  );
}

function KpiCard({
  title,
  value,
  hint,
  href,
  icon: Icon,
  delta,
  loading,
}: {
  title: string;
  value: number;
  hint: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  delta?: number;
  loading?: boolean;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-colors group-hover:bg-muted/20">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardDescription>{title}</CardDescription>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <CardTitle className="text-3xl font-bold tracking-tight tabular-nums">
                {formatNumber(value)}
              </CardTitle>
            )}
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600">
            <Icon className="size-5" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <Skeleton className="h-5 w-40" />
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{hint}</p>
              {typeof delta === "number" ? <DeltaBadge value={delta} /> : null}
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyChartNote({ text }: { text: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

export function AdminDashboard() {
  const cached = peekAdminCache<OverviewData>(OVERVIEW_PATH);
  const [data, setData] = useState<OverviewData | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [chartsLoading, setChartsLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (mode: "initial" | "manual" | "auto" = "initial") => {
    const cachedHit = peekAdminCache<OverviewData>(OVERVIEW_PATH);
    if (mode === "manual") setRefreshing(true);
    else if (mode === "initial" && !cachedHit) setLoading(true);
    if (mode !== "auto") setError(null);

    try {
      if (mode === "initial") {
        if (cachedHit) {
          setData(cachedHit);
          setLoading(false);
          setChartsLoading(false);
          return;
        }

        const kpis = await adminFetch<
          Pick<OverviewData, "generatedAt" | "kpis" | "formStatus">
        >(OVERVIEW_KPI_PATH);
        setData({ ...kpis, ...EMPTY_CHARTS });
        setLoading(false);
        setChartsLoading(true);

        const charts = await adminFetch<typeof EMPTY_CHARTS>(
          OVERVIEW_CHARTS_PATH,
        );
        const full = { ...kpis, ...charts };
        setAdminCache(OVERVIEW_PATH, full);
        setData(full);
        setChartsLoading(false);
        return;
      }

      invalidateAdminCache(OVERVIEW_PATH);
      invalidateAdminCache(OVERVIEW_KPI_PATH);
      invalidateAdminCache(OVERVIEW_CHARTS_PATH);
      const res = await fetch(`${OVERVIEW_PATH}?refresh=1`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(body?.message ?? `خطأ ${res.status}`);
      }
      const result = (await res.json()) as OverviewData;
      setAdminCache(OVERVIEW_PATH, result);
      setData(result);
      setChartsLoading(false);
    } catch (err) {
      if (mode !== "auto") {
        setError(err instanceof Error ? err.message : "تعذّر تحميل التقارير");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setChartsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("initial");
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      void load("auto");
    }, 90_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const pieData = useMemo(() => {
    if (!data) return [];
    return data.formStatus
      .filter((item) => item.count > 0)
      .map((item) => ({
        ...item,
        fill:
          statusConfig[item.status as keyof typeof statusConfig]?.color ??
          statusConfig.other.color,
      }));
  }, [data]);

  const downloadsChart = useMemo(() => {
    if (!data) return [];
    return data.topProducts.map((item) => ({
      name:
        item.title.length > 18 ? `${item.title.slice(0, 18)}…` : item.title,
      downloads: item.downloadsCount,
      fullName: item.title,
    }));
  }, [data]);

  const hasActivity = Boolean(
    data?.activitySeries.some(
      (row) =>
        row.customers > 0 ||
        row.forms > 0 ||
        row.entitlements > 0 ||
        row.newsletter > 0,
    ),
  );

  const kpis = data?.kpis;
  const showSkeleton = loading && !data;
  const showChartsSkeleton = Boolean(chartsLoading || (loading && !data));

  const contentRows = [
    {
      label: "مشاريع منشورة",
      value: `${formatNumber(kpis?.content.projectsPublished ?? 0)} / ${formatNumber(kpis?.content.projectsTotal ?? 0)}`,
      icon: FolderKanbanIcon,
      href: "/admin/projects",
    },
    {
      label: "دورات منشورة",
      value: formatNumber(kpis?.content.productsCore ?? 0),
      icon: GraduationCapIcon,
      href: "/admin/courses",
    },
    {
      label: "كتيبات منشورة",
      value: formatNumber(kpis?.content.productsResource ?? 0),
      icon: BookOpenIcon,
      href: "/admin/booklets",
    },
    {
      label: "عناصر في السلة",
      value: formatNumber(kpis?.content.cartItems ?? 0),
      icon: ShoppingBagIcon,
      href: "/admin/customers",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="نظرة عامة"
        description="تقارير وإحصائيات سهلة القراءة عن نشاط الموقع خلال آخر ٣٠ يوماً."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load("manual")}
            disabled={refreshing || loading}
            className="gap-2"
          >
            <RefreshCwIcon
              className={cn("size-4", refreshing && "animate-spin")}
            />
            تحديث
          </Button>
        }
      />

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void load("manual")}
            >
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="العملاء"
          value={kpis?.customers.total ?? 0}
          hint={`${formatNumber(kpis?.customers.week ?? 0)} تسجيل هذا الأسبوع · ${formatNumber(kpis?.customers.located ?? 0)} بموقع معروف`}
          href="/admin/customers"
          icon={UsersIcon}
          delta={kpis?.customers.weekDelta}
          loading={showSkeleton}
        />
        <KpiCard
          title="ردود الاستمارة"
          value={kpis?.forms.total ?? 0}
          hint={`${formatNumber(kpis?.forms.newCount ?? 0)} بانتظار المتابعة`}
          href="/admin/form-responses"
          icon={ClipboardListIcon}
          delta={kpis?.forms.weekDelta}
          loading={showSkeleton}
        />
        <KpiCard
          title="إجمالي التحميلات"
          value={kpis?.downloads.total ?? 0}
          hint={`${formatNumber(kpis?.downloads.entitlementsWeek ?? 0)} صلاحية جديدة هذا الأسبوع`}
          href="/admin/booklets"
          icon={DownloadIcon}
          loading={showSkeleton}
        />
        <KpiCard
          title="النشرة البريدية"
          value={kpis?.newsletter.total ?? 0}
          hint={`${formatNumber(kpis?.newsletter.week ?? 0)} مشترك هذا الأسبوع`}
          href="/admin/settings"
          icon={MailIcon}
          loading={showSkeleton}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>نشاط الموقع</CardTitle>
            <CardDescription>
              عملاء جدد، ردود استمارة، وصلاحيات تحميل خلال ٣٠ يوماً
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showChartsSkeleton ? (
              <Skeleton className="h-[280px] w-full rounded-xl" />
            ) : !hasActivity ? (
              <EmptyChartNote text="لا يوجد نشاط مسجّل بعد في الأيام الثلاثين الماضية." />
            ) : (
              <ChartContainer
                config={activityConfig}
                className="aspect-[16/8] w-full"
              >
                <AreaChart
                  data={data?.activitySeries ?? []}
                  margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="fillCustomers"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--color-customers)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-customers)"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                    <linearGradient id="fillForms" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-forms)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-forms)"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={28}
                    tickMargin={8}
                  />
                  <YAxis
                    allowDecimals={false}
                    width={28}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    type="monotone"
                    dataKey="customers"
                    stroke="var(--color-customers)"
                    fill="url(#fillCustomers)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="forms"
                    stroke="var(--color-forms)"
                    fill="url(#fillForms)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="entitlements"
                    stroke="var(--color-entitlements)"
                    fill="transparent"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>حالة طلبات المشاريع</CardTitle>
            <CardDescription>توزيع ردود الاستمارة حسب الحالة</CardDescription>
          </CardHeader>
          <CardContent>
            {showChartsSkeleton ? (
              <Skeleton className="mx-auto size-[220px] rounded-full" />
            ) : pieData.length === 0 ? (
              <EmptyChartNote text="لا توجد ردود استمارة بعد." />
            ) : (
              <>
                <ChartContainer
                  config={statusConfig}
                  className="mx-auto aspect-square max-h-[240px]"
                >
                  <PieChart>
                    <ChartTooltip
                      content={<ChartTooltipContent nameKey="label" hideLabel />}
                    />
                    <Pie
                      data={pieData}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={58}
                      outerRadius={88}
                      strokeWidth={3}
                      paddingAngle={2}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.status} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="mt-2 space-y-2">
                  {data?.formStatus.map((item) => (
                    <div
                      key={item.status}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium tabular-nums">
                        {formatNumber(item.count)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>أكثر المنتجات تحميلاً</CardTitle>
            <CardDescription>ترتيب حسب عدّاد التحميلات</CardDescription>
          </CardHeader>
          <CardContent>
            {showChartsSkeleton ? (
              <Skeleton className="h-[260px] w-full rounded-xl" />
            ) : downloadsChart.every((item) => item.downloads === 0) ? (
              <EmptyChartNote text="لم تُسجَّل تحميلات بعد." />
            ) : (
              <ChartContainer
                config={downloadsConfig}
                className="aspect-[16/9] w-full"
              >
                <BarChart
                  data={downloadsChart}
                  layout="vertical"
                  margin={{ left: 8, right: 16, top: 8, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="downloads"
                    fill="var(--color-downloads)"
                    radius={[0, 8, 8, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أنواع طلبات المساعدة</CardTitle>
            <CardDescription>
              أكثر ما يطلبه العملاء عبر الاستمارة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showChartsSkeleton ? (
              <Skeleton className="h-[260px] w-full rounded-xl" />
            ) : !data?.helpTypes.length ? (
              <EmptyChartNote text="لا توجد بيانات كافية لأنواع الطلبات بعد." />
            ) : (
              <ChartContainer config={helpConfig} className="aspect-[16/9] w-full">
                <BarChart
                  data={data.helpTypes}
                  margin={{ left: 8, right: 8, top: 8, bottom: 24 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                    height={48}
                    tickFormatter={(value: string) =>
                      value.length > 12 ? `${value.slice(0, 12)}…` : value
                    }
                  />
                  <YAxis
                    allowDecimals={false}
                    width={28}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[8, 8, 0, 0]}
                    barSize={28}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>توزيع العملاء حسب البلد</CardTitle>
          </CardHeader>
          <CardContent>
            {showChartsSkeleton ? (
              <Skeleton className="h-[260px] w-full rounded-xl" />
            ) : !data?.topCountries?.length ? (
              <EmptyChartNote text="لا توجد بيانات مواقع بعد. ستظهر مع التسجيلات الجديدة." />
            ) : (
              <ChartContainer config={geoConfig} className="aspect-[16/9] w-full">
                <BarChart
                  data={data.topCountries}
                  layout="vertical"
                  margin={{ left: 8, right: 16, top: 8, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={100}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[0, 8, 8, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع العملاء حسب المحافظة/المنطقة</CardTitle>
          </CardHeader>
          <CardContent>
            {showChartsSkeleton ? (
              <Skeleton className="h-[260px] w-full rounded-xl" />
            ) : !data?.topRegions?.length ? (
              <EmptyChartNote text="لا توجد محافظات/مدن مسجّلة بعد." />
            ) : (
              <ChartContainer config={geoConfig} className="aspect-[16/9] w-full">
                <BarChart
                  data={data.topRegions}
                  layout="vertical"
                  margin={{ left: 8, right: 16, top: 8, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={130}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: string) =>
                      value.length > 18 ? `${value.slice(0, 18)}…` : value
                    }
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[0, 8, 8, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>ملخص المحتوى</CardTitle>
            <CardDescription>المنشور والمعروض على الموقع</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {showChartsSkeleton
              ? Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full rounded-lg" />
                ))
              : contentRows.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/15 px-3 py-2.5 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-background text-emerald-600 ring-1 ring-foreground/10">
                        <item.icon className="size-4" />
                      </div>
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {item.value}
                    </span>
                  </Link>
                ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>أحدث العملاء</CardTitle>
              <CardDescription>آخر التسجيلات</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/admin/customers">
                الكل
                <ArrowLeftIcon className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {showChartsSkeleton
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))
              : null}
            {!showChartsSkeleton && data && data.recentCustomers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                لا يوجد عملاء بعد.
              </p>
            ) : null}
            {data?.recentCustomers.map((customer) => (
              <div
                key={customer.id}
                className="rounded-lg border border-border/70 px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {customer.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {customer.email}
                    </p>
                    {customer.region || customer.city || customer.country ? (
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {[customer.region || customer.city, customer.country]
                          .filter(Boolean)
                          .join("، ")}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant="secondary" className="shrink-0 font-normal">
                    {formatNumber(customer._count.entitlements)} كتيّب
                  </Badge>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {formatDate(customer.createdAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>أحدث طلبات المشاريع</CardTitle>
              <CardDescription>آخر ردود الاستمارة</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/admin/form-responses">
                الكل
                <ArrowLeftIcon className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {showChartsSkeleton
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))
              : null}
            {!showChartsSkeleton && data && data.recentForms.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                لا توجد ردود بعد.
              </p>
            ) : null}
            {data?.recentForms.map((form) => (
              <div
                key={form.id}
                className="rounded-lg border border-border/70 px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {form.name?.trim() || "بدون اسم"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {form.helpType?.trim() || "بدون نوع طلب"}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 font-normal">
                    {STATUS_BADGE[form.status] ?? form.status}
                  </Badge>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {formatDate(form.createdAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
