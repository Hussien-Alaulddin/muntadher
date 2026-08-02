/**
 * يولّد صوراً تجريبية 3240×1350 ويربطها بالمشاريع المنشورة
 * لمعاينة شريط بيهانس على صفحة المشروع.
 *
 * التشغيل: npx tsx scripts/seed-project-demo-images.ts
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { PROJECT_CASE_IMAGE } from "../src/lib/project-case-image";

const W = PROJECT_CASE_IMAGE.width;
const H = PROJECT_CASE_IMAGE.height;
const OUT_DIR = path.join(process.cwd(), "public", "uploads", "projects", "demo");

const PALETTES = [
  { bg: "#1a1a1a", accent: "#ff6614", mute: "#2e2e2e" },
  { bg: "#0f172a", accent: "#38bdf8", mute: "#1e293b" },
  { bg: "#1c1917", accent: "#f59e0b", mute: "#292524" },
  { bg: "#14532d", accent: "#86efac", mute: "#166534" },
  { bg: "#4c1d95", accent: "#e9d5ff", mute: "#5b21b6" },
  { bg: "#7f1d1d", accent: "#fecaca", mute: "#991b1b" },
] as const;

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function renderFrame(options: {
  fileName: string;
  title: string;
  subtitle: string;
  palette: (typeof PALETTES)[number];
  variant: "cover" | "brand" | "app" | "logo" | "card";
}) {
  const { fileName, title, subtitle, palette, variant } = options;
  const isLogo = variant === "logo";
  const isCard = variant === "card";
  const width = isCard ? 1200 : W;
  const height = isCard ? 900 : H;

  const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.bg}"/>
      <stop offset="100%" stop-color="${palette.mute}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  ${
    isLogo
      ? `
  <circle cx="${width / 2}" cy="${height / 2 - 40}" r="160" fill="${palette.accent}" opacity="0.95"/>
  <text x="50%" y="${height / 2 + 40}" text-anchor="middle" fill="#ffffff" font-size="72" font-family="Arial, sans-serif" font-weight="700">${escapeXml(title.slice(0, 18))}</text>
  `
      : `
  <rect x="120" y="120" width="${width - 240}" height="${height - 240}" rx="0" fill="none" stroke="${palette.accent}" stroke-width="8" opacity="0.55"/>
  <text x="180" y="280" fill="${palette.accent}" font-size="48" font-family="Arial, sans-serif" font-weight="600">${escapeXml(subtitle)}</text>
  <text x="180" y="420" fill="#ffffff" font-size="96" font-family="Arial, sans-serif" font-weight="700">${escapeXml(title.slice(0, 28))}</text>
  <text x="180" y="${height - 180}" fill="#ffffff" font-size="36" font-family="Arial, sans-serif" opacity="0.7">${width} × ${height}</text>
  `
  }
</svg>`;

  const outPath = path.join(OUT_DIR, fileName);
  await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(outPath);
  return `/uploads/projects/demo/${fileName}`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const prisma = new PrismaClient();

  try {
    const projects = await prisma.project.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      select: { id: true, slug: true, title: true },
    });

    if (projects.length === 0) {
      console.log("لا توجد مشاريع منشورة.");
      return;
    }

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const palette = PALETTES[i % PALETTES.length];
      const base = project.slug;

      const cardUrl = await renderFrame({
        fileName: `${base}-card.jpg`,
        title: project.title,
        subtitle: "بطاقة المشروع",
        palette,
        variant: "card",
      });
      const logoUrl = await renderFrame({
        fileName: `${base}-logo.jpg`,
        title: project.title.split("|")[0]?.trim() || project.title,
        subtitle: "الشعار",
        palette,
        variant: "logo",
      });
      const coverUrl = await renderFrame({
        fileName: `${base}-cover.jpg`,
        title: project.title,
        subtitle: "غلاف المشروع",
        palette,
        variant: "cover",
      });
      const brand1 = await renderFrame({
        fileName: `${base}-brand-1.jpg`,
        title: project.title,
        subtitle: "عنصر هوية 01",
        palette,
        variant: "brand",
      });
      const brand2 = await renderFrame({
        fileName: `${base}-brand-2.jpg`,
        title: project.title,
        subtitle: "عنصر هوية 02",
        palette,
        variant: "brand",
      });
      const app1 = await renderFrame({
        fileName: `${base}-app-1.jpg`,
        title: project.title,
        subtitle: "تطبيق 01",
        palette,
        variant: "app",
      });
      const app2 = await renderFrame({
        fileName: `${base}-app-2.jpg`,
        title: project.title,
        subtitle: "تطبيق 02",
        palette,
        variant: "app",
      });

      await prisma.project.update({
        where: { id: project.id },
        data: {
          imageUrl: cardUrl,
          logoImageUrl: logoUrl,
          coverImageUrl: coverUrl,
          brandGallery: [
            {
              imageUrl: brand1,
              caption: "عنصر هوية 01",
              layout: "full",
              aspect: "3240:1350",
            },
            {
              imageUrl: brand2,
              caption: "عنصر هوية 02",
              layout: "full",
              aspect: "3240:1350",
            },
          ],
          applicationGallery: [
            {
              imageUrl: app1,
              caption: "تطبيق 01",
              layout: "full",
              aspect: "3240:1350",
            },
            {
              imageUrl: app2,
              caption: "تطبيق 02",
              layout: "full",
              aspect: "3240:1350",
            },
          ],
        },
      });

      console.log(`✓ ${project.slug}`);
    }

    // كسر كاش المحتوى إن وُجدت ملفات جاهزة محلياً
    await writeFile(
      path.join(OUT_DIR, ".seeded-at"),
      new Date().toISOString(),
      "utf8",
    );
    console.log(`\nتم تجهيز ${projects.length} مشاريع بصور ${W}×${H}.`);
    console.log("افتح /projects/[slug] لمعاينة الشريط.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
