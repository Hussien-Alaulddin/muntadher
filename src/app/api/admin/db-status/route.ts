import { NextResponse } from "next/server";
import { existsSync, readdirSync } from "fs";
import path from "path";
import { checkAdmin } from "@/lib/admin-auth";
import { isSqliteDatabase } from "@/lib/db-dialect";
import {
  getMediaRoot,
  preferLocalMediaStorage,
  publicMediaRootDir,
  privateMediaRootDir,
} from "@/lib/media-paths";
import { isSupabaseStorageConfigured } from "@/lib/supabase-admin";
import { getPrisma, resetPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

function listTopEntries(dir: string) {
  try {
    if (!existsSync(dir)) return { exists: false, entries: [] as string[] };
    return {
      exists: true,
      entries: readdirSync(dir).slice(0, 40),
    };
  } catch (error) {
    return {
      exists: false,
      entries: [] as string[],
      error: error instanceof Error ? error.message : "تعذّر القراءة",
    };
  }
}

/** فحص اتصال قاعدة البيانات + مسار التخزين للتشخيص من لوحة التحكم */
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

  const mediaRoot = getMediaRoot();
  const publicRoot = publicMediaRootDir();
  const privateRoot = privateMediaRootDir();
  const storage = {
    preferLocal: preferLocalMediaStorage(),
    mediaRootEnv: process.env.MEDIA_ROOT?.trim() || null,
    mediaRootResolved: mediaRoot,
    publicRoot,
    privateRoot,
    cwd: process.cwd(),
    home: process.env.HOME || null,
    supabaseConfigured: isSupabaseStorageConfigured(),
    mediaRootListing: mediaRoot ? listTopEntries(mediaRoot) : null,
    publicRootListing: listTopEntries(publicRoot),
    projectsListing: listTopEntries(path.join(publicRoot, "projects")),
  };

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
      storage,
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
      const tables = await prisma.$queryRawUnsafe<
        Array<Record<string, string>>
      >("SHOW TABLES");
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
      storage,
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
        storage,
      },
      { status: 503 },
    );
  }
}
