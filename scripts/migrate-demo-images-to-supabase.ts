/**
 * يرفع صور /uploads/projects/demo من الجهاز إلى Supabase
 * ويحدّث روابط المشاريع في قاعدة البيانات.
 *
 * npx tsx scripts/migrate-demo-images-to-supabase.ts
 */
import { readFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import {
  ensureMediaBucket,
  getMediaBucket,
  getSupabaseAdmin,
  getSupabaseProjectUrl,
  isSupabaseStorageConfigured,
} from "../src/lib/supabase-admin";

const LOCAL_PREFIX = "/uploads/";

function isLocalUpload(url: string | null | undefined): url is string {
  return Boolean(url && url.startsWith(LOCAL_PREFIX));
}

function localPathFromUrl(url: string) {
  return path.join(process.cwd(), "public", url.replace(/^\//, ""));
}

function objectKeyFromLocalUrl(url: string) {
  // /uploads/projects/demo/x.jpg → projects/demo/x.jpg
  return url.slice(LOCAL_PREFIX.length);
}

async function main() {
  if (!isSupabaseStorageConfigured()) {
    throw new Error("Supabase Storage غير مهيأ في .env");
  }

  const supabase = getSupabaseAdmin();
  const projectUrl = getSupabaseProjectUrl();
  if (!supabase || !projectUrl) throw new Error("عميل Supabase غير متاح");

  await ensureMediaBucket(supabase);
  const bucket = getMediaBucket();
  const prisma = new PrismaClient();
  const cache = new Map<string, string>();

  async function migrateUrl(url: string | null): Promise<string | null> {
    if (!isLocalUpload(url)) return url;
    if (cache.has(url)) return cache.get(url)!;

    const filePath = localPathFromUrl(url);
    const objectKey = objectKeyFromLocalUrl(url);
    const bytes = await readFile(filePath);

    const { error } = await supabase.storage.from(bucket).upload(objectKey, bytes, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (error) throw new Error(`${objectKey}: ${error.message}`);

    const publicUrl = `${projectUrl}/storage/v1/object/public/${bucket}/${objectKey}`;
    cache.set(url, publicUrl);
    console.log(`↑ ${url} → ${publicUrl}`);
    return publicUrl;
  }

  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        slug: true,
        imageUrl: true,
        logoImageUrl: true,
        coverImageUrl: true,
        brandGallery: true,
        applicationGallery: true,
      },
    });

    for (const project of projects) {
      const brandGallery = Array.isArray(project.brandGallery)
        ? project.brandGallery
        : [];
      const applicationGallery = Array.isArray(project.applicationGallery)
        ? project.applicationGallery
        : [];

      const nextBrand = [];
      for (const item of brandGallery) {
        if (!item || typeof item !== "object") continue;
        const row = item as Record<string, unknown>;
        const imageUrl = await migrateUrl(
          typeof row.imageUrl === "string" ? row.imageUrl : null,
        );
        nextBrand.push({ ...row, imageUrl });
      }

      const nextApp = [];
      for (const item of applicationGallery) {
        if (!item || typeof item !== "object") continue;
        const row = item as Record<string, unknown>;
        const imageUrl = await migrateUrl(
          typeof row.imageUrl === "string" ? row.imageUrl : null,
        );
        nextApp.push({ ...row, imageUrl });
      }

      await prisma.project.update({
        where: { id: project.id },
        data: {
          imageUrl: await migrateUrl(project.imageUrl),
          logoImageUrl: await migrateUrl(project.logoImageUrl),
          coverImageUrl: await migrateUrl(project.coverImageUrl),
          brandGallery: nextBrand,
          applicationGallery: nextApp,
        },
      });

      console.log(`✓ ${project.slug}`);
    }

    console.log(`\nتم رفع ${cache.size} ملفاً إلى bucket «${bucket}».`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
