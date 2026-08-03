import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { isSqliteDatabase } from "@/lib/db-dialect";
import { getPrisma, resetPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** فحص اتصال قاعدة البيانات للتشخيص من لوحة التحكم */
export async function GET(request: Request) {
  const denied = await checkAdmin(request);
  if (denied) return denied;

  const raw =
    process.env.DATABASE_URL?.trim() ||
    process.env.MYSQL_DATABASE_URL?.trim() ||
    process.env.HOSTINGER_DATABASE_URL?.trim() ||
    "";

  const sqlite = isSqliteDatabase() || raw.startsWith("file:");
  let host = "";
  let db = "";
  let user = "";
  let protocol = "";
  try {
    if (raw.startsWith("file:")) {
      protocol = "sqlite";
      db = raw.replace(/^file:/, "");
      host = "local";
    } else {
      const parsed = new URL(raw);
      protocol = parsed.protocol.replace(":", "");
      host = `${parsed.hostname}:${parsed.port || ""}`;
      db = parsed.pathname.replace(/^\//, "");
      user = parsed.username;
    }
  } catch {
    /* ignore */
  }

  await resetPrisma();
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({
      ok: false,
      message: "لا يوجد رابط قاعدة بيانات",
      protocol,
      host,
      db,
      user,
      hasMysqlEnv: Boolean(process.env.MYSQL_DATABASE_URL?.trim()),
    });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    let tableNames: string[] = [];
    if (sqlite) {
      const tables = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      );
      tableNames = tables.map((row) => row.name).filter(Boolean);
    } else {
      const tables = await prisma.$queryRawUnsafe<Array<Record<string, string>>>(
        "SHOW TABLES",
      );
      tableNames = tables.map((row) => Object.values(row)[0]).filter(Boolean);
    }
    return NextResponse.json({
      ok: true,
      message: sqlite
        ? "الاتصال بـ SQLite المحلي ناجح"
        : "الاتصال بـ MySQL ناجح",
      protocol,
      host,
      db,
      user,
      hasMysqlEnv: Boolean(process.env.MYSQL_DATABASE_URL?.trim()),
      tableCount: tableNames.length,
      tables: tableNames,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message.slice(0, 400) : "فشل",
        protocol,
        host,
        db,
        user,
        hasMysqlEnv: Boolean(process.env.MYSQL_DATABASE_URL?.trim()),
      },
      { status: 503 },
    );
  }
}
