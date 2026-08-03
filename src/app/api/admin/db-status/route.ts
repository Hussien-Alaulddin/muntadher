import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { getPrisma, resetPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** فحص اتصال قاعدة البيانات للتشخيص من لوحة التحكم */
export async function GET(request: Request) {
  const denied = await checkAdmin(request);
  if (denied) return denied;

  const raw =
    process.env.MYSQL_DATABASE_URL?.trim() ||
    process.env.HOSTINGER_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    "";

  let host = "";
  let db = "";
  let user = "";
  let protocol = "";
  try {
    const parsed = new URL(raw);
    protocol = parsed.protocol.replace(":", "");
    host = `${parsed.hostname}:${parsed.port || ""}`;
    db = parsed.pathname.replace(/^\//, "");
    user = parsed.username;
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
    const tables = await prisma.$queryRawUnsafe<Array<Record<string, string>>>(
      "SHOW TABLES",
    );
    const tableNames = tables.map((row) => Object.values(row)[0]).filter(Boolean);
    return NextResponse.json({
      ok: true,
      message: "الاتصال بـ MySQL ناجح",
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
