import { NextResponse } from "next/server";
import { checkAdmin, requireDatabase } from "@/lib/admin-auth";
import { adminRouteError } from "@/lib/admin-route-error";
import {
  buildOverviewCharts,
  buildOverviewFull,
  buildOverviewKpis,
} from "@/lib/admin-overview";
import { withDbRetry } from "@/lib/prisma";

export async function GET(request: Request) {
  const denied = await checkAdmin(request);
  if (denied) return denied;

  const { error } = requireDatabase();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const part = searchParams.get("part") ?? "all";
    const bypassCache = searchParams.get("refresh") === "1";

    const data = await withDbRetry(async (db) => {
      if (part === "kpis") return buildOverviewKpis(db);
      if (part === "charts") return buildOverviewCharts(db);
      return buildOverviewFull(db, { bypassCache });
    });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, max-age=30",
      },
    });
  } catch (err) {
    console.error("[admin:overview]", err);
    return adminRouteError(err);
  }
}
