import { NextResponse } from "next/server";
import { checkAdmin, requireDatabase } from "@/lib/admin-auth";
import { adminRouteError } from "@/lib/admin-route-error";
import { withDbRetry } from "@/lib/prisma";
import { restoreDemoContent } from "@/lib/restore-demo-content";
import { revalidateSite } from "@/lib/revalidate-site";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * استعادة المشاريع/الدورات/الكتيبات/الجوائز التجريبية مع صور البطاقات.
 * يتطلب تسجيل دخول أدمن: POST /api/admin/restore-demo-content
 * أو GET ?confirm=1
 */
async function runRestore() {
  const result = await withDbRetry((prisma) => restoreDemoContent(prisma));
  revalidateSite();
  return NextResponse.json({
    ok: true,
    message: "تمت استعادة المحتوى التجريبي مع الصور",
    ...result,
  });
}

export async function GET(request: Request) {
  const unauthorized = await checkAdmin(request);
  if (unauthorized) return unauthorized;

  const { error } = requireDatabase();
  if (error) return error;

  if (new URL(request.url).searchParams.get("confirm") !== "1") {
    return NextResponse.json({
      ok: false,
      message: "للتأكيد أضف ?confirm=1 أو استخدم POST",
    });
  }

  try {
    return await runRestore();
  } catch (err) {
    console.error("[restore-demo-content]", err);
    return adminRouteError(err);
  }
}

export async function POST(request: Request) {
  const unauthorized = await checkAdmin(request);
  if (unauthorized) return unauthorized;

  const { error } = requireDatabase();
  if (error) return error;

  try {
    return await runRestore();
  } catch (err) {
    console.error("[restore-demo-content]", err);
    return adminRouteError(err);
  }
}
