import { NextResponse } from "next/server";
import { checkAdmin, requireDatabase } from "@/lib/admin-auth";
import { adminRouteError } from "@/lib/admin-route-error";
import { buildReportXlsxBuffer } from "@/lib/admin-report-xlsx";
import {
  buildReportPayload,
  clearReportCache,
  getCachedReport,
  isReportType,
  setCachedReport,
} from "@/lib/admin-reports";
import { withDbRetry } from "@/lib/prisma";

export const runtime = "nodejs";

type Params = { params: Promise<{ type: string }> };

export async function GET(request: Request, { params }: Params) {
  const denied = await checkAdmin(request);
  if (denied) return denied;

  const { error } = requireDatabase();
  if (error) return error;

  const { type: rawType } = await params;
  if (!isReportType(rawType)) {
    return NextResponse.json({ message: "نوع التقرير غير معروف" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";
  const preview =
    format === "json" && searchParams.get("mode") === "preview";
  const forceRefresh = request.headers.get("x-admin-refresh") === "1";

  if (forceRefresh) clearReportCache(rawType);

  try {
    let report =
      preview && !forceRefresh ? getCachedReport(rawType, true) : null;
    if (!report) {
      report = await withDbRetry((db) =>
        buildReportPayload(db, rawType, { preview }),
      );
      if (preview) setCachedReport(rawType, true, report);
    }

    if (format === "xlsx" || format === "excel") {
      const xlsx = await buildReportXlsxBuffer(report);
      const filename = `montader-${rawType}-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      return new NextResponse(new Uint8Array(xlsx), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json(report, {
      headers: preview
        ? { "Cache-Control": "private, max-age=30" }
        : { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[admin:reports]", err);
    return adminRouteError(err);
  }
}
