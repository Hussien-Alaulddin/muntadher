import { NextResponse } from "next/server";
import { checkAdmin, requireDatabase } from "@/lib/admin-auth";
import { REPORT_CATALOG } from "@/lib/admin-reports";

export async function GET(request: Request) {
  const denied = await checkAdmin(request);
  if (denied) return denied;

  const { error } = requireDatabase();
  if (error) return error;

  return NextResponse.json({
    items: REPORT_CATALOG,
  });
}
