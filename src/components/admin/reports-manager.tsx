"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DownloadIcon,
  FileSpreadsheetIcon,
  LayersIcon,
  Loader2Icon,
  MessagesSquareIcon,
  PackageIcon,
  RefreshCwIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { adminFetch, AdminApiError, prefetchAdmin } from "@/lib/admin-api";
import { invalidateAdminCache, peekAdminCache } from "@/lib/admin-cache";
import type { ReportMeta, ReportPayload, ReportType } from "@/lib/admin-reports";
import { AdminPageHeader } from "@/components/admin/admin-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const LIST_PATH = "/api/admin/reports";

const REPORT_ICONS: Record<
  ReportType,
  typeof FileSpreadsheetIcon
> = {
  full: FileSpreadsheetIcon,
  customers: UsersIcon,
  forms: MessagesSquareIcon,
  products: PackageIcon,
  content: LayersIcon,
};

function previewPath(type: ReportType) {
  return `/api/admin/reports/${type}?mode=preview`;
}

export function ReportsManager() {
  const cached = peekAdminCache<{ items: ReportMeta[] }>(LIST_PATH);
  const [items, setItems] = useState<ReportMeta[]>(() => cached?.items ?? []);
  const [loading, setLoading] = useState(() => cached == null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ReportPayload | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloading, setDownloading] = useState<ReportType | null>(null);

  const load = useCallback(async () => {
    const hit = peekAdminCache<{ items: ReportMeta[] }>(LIST_PATH);
    if (hit) {
      setItems(hit.items ?? []);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await adminFetch<{ items: ReportMeta[] }>(LIST_PATH);
      setItems(data.items ?? []);
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : "تعذّر تحميل التقارير",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function refresh() {
    setLoading(true);
    setError(null);
    invalidateAdminCache("/api/admin/reports");
    try {
      const data = await adminFetch<{ items: ReportMeta[] }>(LIST_PATH, {
        bypassCache: true,
      });
      setItems(data.items ?? []);

      if (preview) {
        setPreviewLoading(true);
        const refreshed = await adminFetch<ReportPayload>(
          previewPath(preview.type),
          {
            bypassCache: true,
            headers: { "x-admin-refresh": "1" },
          },
        );
        setPreview(refreshed);
      }

      toast.success("تم تحديث التقارير");
    } catch (err) {
      const message =
        err instanceof AdminApiError ? err.message : "تعذّر التحديث";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setPreviewLoading(false);
    }
  }

  async function openPreview(type: ReportType) {
    const path = previewPath(type);
    const hit = peekAdminCache<ReportPayload>(path);
    if (hit) {
      setPreview(hit);
      setPreviewLoading(false);
      return;
    }

    setPreviewLoading(true);
    setError(null);
    try {
      const data = await adminFetch<ReportPayload>(path);
      setPreview(data);
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : "تعذّر فتح التقرير",
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  async function downloadExcel(type: ReportType) {
    setDownloading(type);
    try {
      const res = await fetch(`/api/admin/reports/${type}?format=xlsx`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(body?.message ?? `خطأ ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `montader-${type}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("تم تنزيل ملف Excel");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر تنزيل Excel");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="التقارير"
        description="تقارير مفصّلة عن نشاط الموقع مع إمكانية التنزيل كملف Excel."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void refresh()}
            disabled={loading || previewLoading}
          >
            <RefreshCwIcon className={loading ? "size-4 animate-spin" : "size-4"} />
            تحديث
          </Button>
        }
      />

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading && items.length === 0
          ? Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardFooter>
                  <Skeleton className="h-9 w-28" />
                </CardFooter>
              </Card>
            ))
          : items.map((item) => {
              const Icon = REPORT_ICONS[item.id];
              return (
              <Card
                key={item.id}
                className="flex h-full flex-col"
                onMouseEnter={() => prefetchAdmin(previewPath(item.id))}
                onFocusCapture={() => prefetchAdmin(previewPath(item.id))}
              >
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Badge variant="secondary" className="font-normal">
                    Excel جاهز للتنزيل
                  </Badge>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void openPreview(item.id)}
                    disabled={previewLoading}
                  >
                    معاينة
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => void downloadExcel(item.id)}
                    disabled={downloading === item.id}
                  >
                    {downloading === item.id ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <DownloadIcon className="size-4" />
                    )}
                    تحميل Excel
                  </Button>
                </CardFooter>
              </Card>
              );
            })}
      </div>

      {previewLoading ? (
        <Card>
          <CardContent className="space-y-3 py-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ) : null}

      {preview ? (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>{preview.title}</CardTitle>
              <CardDescription>
                توليدي:{" "}
                {new Date(preview.generatedAt).toLocaleString("en-GB")}
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => void downloadExcel(preview.type)}
              disabled={downloading === preview.type}
            >
              {downloading === preview.type ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <DownloadIcon className="size-4" />
              )}
              تحميل Excel
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-2 text-sm font-semibold">الملخص</h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {preview.summary.map((item) => (
                  <div
                    key={`${item.label}-${item.value}`}
                    className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2"
                  >
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-semibold tabular-nums">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {preview.sections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-2 text-sm font-semibold">{section.title}</h3>
                <div className="space-y-1.5">
                  {section.rows.map((row) => (
                    <div
                      key={`${section.title}-${row.label}`}
                      className="flex items-center justify-between gap-3 border-b border-border/50 py-1.5 text-sm"
                    >
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium tabular-nums">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {preview.tables.map((table) => (
              <div key={table.title} className="space-y-2">
                <h3 className="text-sm font-semibold">{table.title}</h3>
                <div className="overflow-x-auto rounded-lg border border-border/70">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-muted/40 text-muted-foreground">
                      <tr>
                        {table.headers.map((header) => (
                          <th
                            key={`${table.title}-${header}`}
                            className="px-3 py-2 text-start font-medium"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.slice(0, 12).map((row, index) => (
                        <tr
                          key={`${table.title}-${index}`}
                          className="border-t border-border/60"
                        >
                          {row.map((cell, cellIndex) => (
                            <td
                              key={`${table.title}-${index}-${cellIndex}`}
                              className="px-3 py-2 align-top"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {table.rows.length > 12 ? (
                  <p className="text-xs text-muted-foreground">
                    عرض أول 12 صفاً — الملف الكامل في Excel
                  </p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
