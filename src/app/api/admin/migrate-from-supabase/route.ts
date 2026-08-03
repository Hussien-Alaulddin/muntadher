import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { migratePostgresToMysql } from "@/lib/migrate-from-postgres";
import { getPrisma, resetPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * ترحيل لمرة واحدة من Supabase Postgres → MySQL على السيرفر.
 * لا يحتاج Remote MySQL.
 *
 * المتطلب: SOURCE_DATABASE_URL في متغيرات البيئة (رابط Postgres القديم)
 * الاستخدام وأنت مسجّل دخول أدمن:
 *   /api/admin/migrate-from-supabase?confirm=1
 */
async function runMigration() {
  const source = process.env.SOURCE_DATABASE_URL?.trim();
  if (!source?.startsWith("postgres")) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "أضف SOURCE_DATABASE_URL = رابط Postgres من Supabase في متغيرات البيئة ثم أعد تشغيل التطبيق",
      },
      { status: 400 },
    );
  }

  await resetPrisma();
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { ok: false, message: "MySQL غير متاح" },
      { status: 503 },
    );
  }

  const result = await migratePostgresToMysql({
    sourceDatabaseUrl: source,
    prisma,
  });

  return NextResponse.json(result);
}

export async function GET(request: Request) {
  const denied = await checkAdmin(request);
  if (denied) return denied;

  const confirm = new URL(request.url).searchParams.get("confirm");
  if (confirm !== "1") {
    return NextResponse.json({
      ok: false,
      message:
        "للتنفيذ أضف ?confirm=1 للرابط وأنت مسجّل دخول في لوحة التحكم",
    });
  }

  try {
    return await runMigration();
  } catch (error) {
    console.error("[migrate-from-supabase]", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "فشل الترحيل",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const denied = await checkAdmin(request);
  if (denied) return denied;

  try {
    return await runMigration();
  } catch (error) {
    console.error("[migrate-from-supabase]", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "فشل الترحيل",
      },
      { status: 500 },
    );
  }
}
