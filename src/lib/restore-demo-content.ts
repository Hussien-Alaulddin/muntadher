import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import type { PrismaClient } from "@prisma/client";
import { ADMIN_MEDIA_SIZES } from "@/lib/admin-media-sizes";
import { demoAwards } from "@/lib/demo-content";
import {
  demoBookletsExtra,
  defaultDemoBookletDetail,
} from "@/lib/demo-booklet";
import {
  publicMediaRootDir,
  publicMediaUrlForKey,
} from "@/lib/media-paths";
import {
  productsPlaceholder,
  projectsPlaceholder,
} from "@/lib/placeholder-content";
import { PROJECT_CASE_IMAGE } from "@/lib/project-case-image";

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

async function renderAndSave(options: {
  objectKey: string;
  title: string;
  subtitle: string;
  width: number;
  height: number;
  palette: (typeof PALETTES)[number];
  variant?: "frame" | "logo" | "award";
}): Promise<string> {
  const {
    objectKey,
    title,
    subtitle,
    width,
    height,
    palette,
    variant = "frame",
  } = options;

  const svg =
    variant === "logo"
      ? `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.bg}"/>
      <stop offset="100%" stop-color="${palette.mute}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="${width / 2}" cy="${height / 2 - 40}" r="${Math.min(width, height) * 0.18}" fill="${palette.accent}" opacity="0.95"/>
  <text x="50%" y="${height / 2 + 50}" text-anchor="middle" fill="#ffffff" font-size="${Math.round(Math.min(width, height) * 0.06)}" font-family="Arial, sans-serif" font-weight="700">${escapeXml(title.slice(0, 20))}</text>
</svg>`
      : variant === "award"
        ? `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.bg}"/>
      <stop offset="100%" stop-color="${palette.mute}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="${width / 2}" cy="${height / 2 - 80}" r="180" fill="none" stroke="${palette.accent}" stroke-width="14"/>
  <circle cx="${width / 2}" cy="${height / 2 - 80}" r="110" fill="${palette.accent}" opacity="0.9"/>
  <text x="50%" y="${height / 2 + 160}" text-anchor="middle" fill="#ffffff" font-size="64" font-family="Arial, sans-serif" font-weight="700">${escapeXml(title.slice(0, 22))}</text>
  <text x="50%" y="${height / 2 + 240}" text-anchor="middle" fill="${palette.accent}" font-size="36" font-family="Arial, sans-serif">${escapeXml(subtitle.slice(0, 28))}</text>
</svg>`
        : `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.bg}"/>
      <stop offset="100%" stop-color="${palette.mute}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect x="${Math.round(width * 0.06)}" y="${Math.round(height * 0.08)}" width="${Math.round(width * 0.88)}" height="${Math.round(height * 0.84)}" fill="none" stroke="${palette.accent}" stroke-width="8" opacity="0.55"/>
  <text x="${Math.round(width * 0.1)}" y="${Math.round(height * 0.28)}" fill="${palette.accent}" font-size="${Math.round(height * 0.045)}" font-family="Arial, sans-serif" font-weight="600">${escapeXml(subtitle)}</text>
  <text x="${Math.round(width * 0.1)}" y="${Math.round(height * 0.42)}" fill="#ffffff" font-size="${Math.round(height * 0.08)}" font-family="Arial, sans-serif" font-weight="700">${escapeXml(title.slice(0, 28))}</text>
  <text x="${Math.round(width * 0.1)}" y="${Math.round(height * 0.88)}" fill="#ffffff" font-size="${Math.round(height * 0.035)}" font-family="Arial, sans-serif" opacity="0.7">${width} × ${height}</text>
</svg>`;

  const absolute = path.join(publicMediaRootDir(), objectKey);
  await mkdir(path.dirname(absolute), { recursive: true });
  await sharp(Buffer.from(svg)).jpeg({ quality: 84 }).toFile(absolute);
  return publicMediaUrlForKey(objectKey);
}

export type RestoreDemoResult = {
  projects: number;
  products: number;
  awards: number;
};

/** يعيد زراعة المشاريع/المنتجات/الجوائز التجريبية مع صور بطاقات مناسبة */
export async function restoreDemoContent(
  prisma: PrismaClient,
): Promise<RestoreDemoResult> {
  const galleryW = PROJECT_CASE_IMAGE.width;
  const galleryH = PROJECT_CASE_IMAGE.height;
  const cardW = ADMIN_MEDIA_SIZES.projectCard.width;
  const cardH = ADMIN_MEDIA_SIZES.projectCard.height;
  const productW = ADMIN_MEDIA_SIZES.productCard.width;
  const productH = ADMIN_MEDIA_SIZES.productCard.height;
  const awardW = ADMIN_MEDIA_SIZES.award.width;
  const awardH = ADMIN_MEDIA_SIZES.award.height;

  for (const [index, project] of projectsPlaceholder.entries()) {
    const palette = PALETTES[index % PALETTES.length];
    const base = project.slug;

    const imageUrl = await renderAndSave({
      objectKey: `projects/demo/${base}-card.jpg`,
      title: project.title,
      subtitle: "بطاقة المشروع",
      width: cardW,
      height: cardH,
      palette,
    });
    const logoImageUrl = await renderAndSave({
      objectKey: `projects/demo/${base}-logo.jpg`,
      title: project.title.split("|")[0]?.trim() || project.title,
      subtitle: "الشعار",
      width: 1200,
      height: 1200,
      palette,
      variant: "logo",
    });
    const coverImageUrl = await renderAndSave({
      objectKey: `projects/demo/${base}-cover.jpg`,
      title: project.title,
      subtitle: "غلاف المشروع",
      width: galleryW,
      height: galleryH,
      palette,
    });
    const brand1 = await renderAndSave({
      objectKey: `projects/demo/${base}-brand-1.jpg`,
      title: project.title,
      subtitle: "عنصر هوية 01",
      width: galleryW,
      height: galleryH,
      palette,
    });
    const brand2 = await renderAndSave({
      objectKey: `projects/demo/${base}-brand-2.jpg`,
      title: project.title,
      subtitle: "عنصر هوية 02",
      width: galleryW,
      height: galleryH,
      palette,
    });
    const app1 = await renderAndSave({
      objectKey: `projects/demo/${base}-app-1.jpg`,
      title: project.title,
      subtitle: "تطبيق 01",
      width: galleryW,
      height: galleryH,
      palette,
    });
    const app2 = await renderAndSave({
      objectKey: `projects/demo/${base}-app-2.jpg`,
      title: project.title,
      subtitle: "تطبيق 02",
      width: galleryW,
      height: galleryH,
      palette,
    });

    await prisma.project.upsert({
      where: { slug: project.slug },
      create: {
        slug: project.slug,
        title: project.title,
        category: project.category,
        description: project.description,
        meta: project.meta,
        externalCaseStudyUrl: project.externalCaseStudyUrl ?? null,
        externalCaseStudyLabel: project.externalCaseStudyLabel ?? null,
        imageUrl,
        logoImageUrl,
        coverImageUrl,
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
        order: index + 1,
        published: true,
      },
      update: {
        title: project.title,
        category: project.category,
        description: project.description,
        meta: project.meta,
        externalCaseStudyUrl: project.externalCaseStudyUrl ?? null,
        externalCaseStudyLabel: project.externalCaseStudyLabel ?? null,
        imageUrl,
        logoImageUrl,
        coverImageUrl,
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
        order: index + 1,
        published: true,
      },
    });
  }

  const bookletExtras = [
    {
      slug: "colors-guide",
      type: "كتيّب إلكتروني",
      title: "دليل اختيار الألوان",
      description:
        "مرجع رقمي موجه للمصممين لضمان اختيار ألوان متماسكة في الهوية",
      price: "مجاني",
      ctaLabel: "تحميل مجاني",
      group: "resource" as const,
      downloadsCount: defaultDemoBookletDetail.downloadsCount,
      files: defaultDemoBookletDetail.files,
      body: defaultDemoBookletDetail.bodyIntro,
    },
    ...demoBookletsExtra,
  ];

  let order = 1;
  for (const [index, product] of productsPlaceholder.entries()) {
    const palette = PALETTES[index % PALETTES.length];
    const imageUrl = await renderAndSave({
      objectKey: `products/demo/${product.slug}-card.jpg`,
      title: product.title,
      subtitle: product.group === "core" ? "دورة تدريبية" : "كتيّب إلكتروني",
      width: productW,
      height: productH,
      palette,
    });
    const coverImageUrl = await renderAndSave({
      objectKey: `products/demo/${product.slug}-cover.jpg`,
      title: product.title,
      subtitle: "غلاف التفاصيل",
      width: ADMIN_MEDIA_SIZES.productCover.width,
      height: ADMIN_MEDIA_SIZES.productCover.height,
      palette,
    });

    const body =
      "body" in product && typeof product.body === "string"
        ? product.body
        : null;

    await prisma.product.upsert({
      where: { slug: product.slug },
      create: {
        slug: product.slug,
        type: product.type,
        title: product.title,
        description: product.description,
        body,
        price: product.price,
        ctaLabel: product.ctaLabel,
        group: product.group,
        imageUrl,
        coverImageUrl,
        order: order++,
        published: true,
      },
      update: {
        type: product.type,
        title: product.title,
        description: product.description,
        ...(body ? { body } : {}),
        price: product.price,
        ctaLabel: product.ctaLabel,
        group: product.group,
        imageUrl,
        coverImageUrl,
        order: order - 1,
        published: true,
      },
    });
  }

  for (const [index, booklet] of bookletExtras.entries()) {
    if (booklet.slug === "colors-guide") {
      // already handled via productsPlaceholder
      continue;
    }
    const palette = PALETTES[(index + 3) % PALETTES.length];
    const imageUrl = await renderAndSave({
      objectKey: `products/demo/${booklet.slug}-card.jpg`,
      title: booklet.title,
      subtitle: "كتيّب إلكتروني",
      width: productW,
      height: productH,
      palette,
    });
    const coverImageUrl = await renderAndSave({
      objectKey: `products/demo/${booklet.slug}-cover.jpg`,
      title: booklet.title,
      subtitle: "غلاف الكتيّب",
      width: ADMIN_MEDIA_SIZES.productCover.width,
      height: ADMIN_MEDIA_SIZES.productCover.height,
      palette,
    });

    await prisma.product.upsert({
      where: { slug: booklet.slug },
      create: {
        slug: booklet.slug,
        type: booklet.type,
        title: booklet.title,
        description: booklet.description,
        body: booklet.body,
        price: booklet.price,
        ctaLabel: booklet.ctaLabel,
        group: booklet.group,
        downloadsCount: booklet.downloadsCount,
        files: booklet.files,
        imageUrl,
        coverImageUrl,
        order: order++,
        published: true,
      },
      update: {
        description: booklet.description,
        body: booklet.body,
        downloadsCount: booklet.downloadsCount,
        files: booklet.files,
        group: "resource",
        imageUrl,
        coverImageUrl,
        published: true,
      },
    });
  }

  await prisma.award.deleteMany({
    where: {
      OR: [
        { org: "جهة تجريبية" },
        { title: { contains: "تجريبي" } },
      ],
    },
  });

  let awardsCreated = 0;
  for (const [index, award] of demoAwards.entries()) {
    const palette = PALETTES[index % PALETTES.length];
    const imageUrl = await renderAndSave({
      objectKey: `awards/demo/award-${index + 1}.jpg`,
      title: award.title,
      subtitle: award.org,
      width: awardW,
      height: awardH,
      palette,
      variant: "award",
    });
    await prisma.award.create({
      data: {
        org: award.org,
        title: award.title,
        description: award.description,
        imageUrl,
        order: index + 1,
      },
    });
    awardsCreated += 1;
  }

  await writeFile(
    path.join(publicMediaRootDir(), "projects", "demo", ".restored-at"),
    new Date().toISOString(),
    "utf8",
  ).catch(() => undefined);

  return {
    projects: projectsPlaceholder.length,
    products: productsPlaceholder.length + demoBookletsExtra.length,
    awards: awardsCreated,
  };
}
