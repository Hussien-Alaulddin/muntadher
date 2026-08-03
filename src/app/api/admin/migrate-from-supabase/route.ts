import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { migratePostgresToMysql } from "@/lib/migrate-from-postgres";
import { getPrisma, resetPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 300;

function migrationDisabledResponse() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "مسار الترحيل معطّل في الإنتاج. للتفعيل المؤقت فقط: ALLOW_DB_MIGRATE=1 مع SOURCE_DATABASE_URL",
    },
    { status: 403 },
  );
}

function isMigrationAllowed() {
  if (process.env.ALLOW_DB_MIGRATE === "1") return true;
  return process.env.NODE_ENV !== "production";
}

/**
 * ترحيل لمرة واحدة من Supabase Postgres → MySQL على السيرفر.
 * معطّل في الإنتاج ما لم يُضبط ALLOW_DB_MIGRATE=1.
 *
 * المتطلب: SOURCE_DATABASE_URL في متغيرات البيئة (رابط Postgres القديم)
 * الاستخدام وأنت مسجّل دخول أدمن:
 *   /api/admin/migrate-from-supabase?confirm=1
 */
async function runMigration() {
  if (!isMigrationAllowed()) return migrationDisabledResponse();

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

  if (!isMigrationAllowed()) return migrationDisabledResponse();

  const confirm = new URL(request.url).searchParams.get("confirm");
  const diagnose = new URL(request.url).searchParams.get("diagnose");

  if (diagnose === "1") {
    try {
      const source = process.env.SOURCE_DATABASE_URL?.trim();
      if (!source?.startsWith("postgres")) {
        return NextResponse.json(
          { ok: false, message: "SOURCE_DATABASE_URL غير مضبوط" },
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
        diagnoseOnly: true,
      });
      return NextResponse.json(result);
    } catch (error) {
      console.error("[migrate-from-supabase:diagnose]", error);
      return NextResponse.json(
        {
          ok: false,
          message: error instanceof Error ? error.message : "فشل التشخيص",
        },
        { status: 500 },
      );
    }
  }

  if (confirm !== "1") {
    return NextResponse.json({
      ok: false,
      message:
        "للتشخيص: ?diagnose=1 — للتنفيذ: ?confirm=1 (مع تسجيل دخول الأدمن)",
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

  if (!isMigrationAllowed()) return migrationDisabledResponse();

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
