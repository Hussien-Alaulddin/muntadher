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

/**
 * صور Unsplash مرخّصة للاستخدام الحر (Unsplash License).
 * تُحمَّل وتُحفظ محلياً في MEDIA_ROOT حتى لا تعتمد على رابط خارجي لاحقاً.
 */
function unsplashPhoto(
  photoId: string,
  width: number,
  height: number,
): string {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&h=${height}&q=85`;
}

type ProjectImageSet = {
  card: string;
  logo: string;
  cover: string;
  brand: [string, string];
  application: [string, string];
};

/** صور تصميم حقيقية مناسبة لكل مشروع */
const PROJECT_PHOTOS: Record<string, ProjectImageSet> = {
  "rayhan-cafe": {
    card: "photo-1495474472287-4d71bcdd2085",
    logo: "photo-1509042239860-f550ce710b93",
    cover: "photo-1554118811-1e0d58224f24",
    brand: [
      "photo-1442512595331-e89e7384260c",
      "photo-1511920170033-f8396924c348",
    ],
    application: [
      "photo-1453614512568-c4024d13c247",
      "photo-1501339847302-ac426a4a7cbb",
    ],
  },
  "noor-app": {
    card: "photo-1506126613408-eca07ce68773",
    logo: "photo-1518611012118-696072aa579a",
    cover: "photo-1545389336-cf090694435e",
    brand: [
      "photo-1544367567-0f2fcb009e0b",
      "photo-1506126613408-eca07ce68773",
    ],
    application: [
      "photo-1518310383802-640c2de311b2",
      "photo-1544367567-0f2fcb009e0b",
    ],
  },
  "khatwa-studio": {
    card: "photo-1522071820081-009f0129c71c",
    logo: "photo-1558655146-9f40138edfeb",
    cover: "photo-1497366216548-37526070297c",
    brand: [
      "photo-1586717791821-3f44a563fa4c",
      "photo-1561070791-2526d30994b5",
    ],
    application: [
      "photo-1558655146-d09347e92766",
      "photo-1460925895917-afdab827c52f",
    ],
  },
  "athar-personal": {
    card: "photo-1507003211169-0a1dd7228f2d",
    logo: "photo-1472099645785-5658abf4ff4e",
    cover: "photo-1486312338219-ce68d2c6f44d",
    brand: [
      "photo-1499750310107-5fef28a66643",
      "photo-1516321318423-f06f85e504b3",
    ],
    application: [
      "photo-1432888498266-38ffec3eaf0a",
      "photo-1454165804606-c3d57bc86b40",
    ],
  },
  "oasis-resort": {
    card: "photo-1566073771259-6a8506099945",
    logo: "photo-1571896349842-33c89424de2d",
    cover: "photo-1582719508461-905c673771fd",
    brand: [
      "photo-1520250497591-112f2f40a3f4",
      "photo-1571003123894-1f0594d2b5d9",
    ],
    application: [
      "photo-1564501049412-61c2a3083791",
      "photo-1611892440504-42a792e24d32",
    ],
  },
  "warraq-brand": {
    card: "photo-1483985988355-763728e1935b",
    logo: "photo-1469334031218-e382a71b716b",
    cover: "photo-1490481651871-ab68de25d43d",
    brand: [
      "photo-1445205170230-053b83016050",
      "photo-1469334031218-e382a71b716b",
    ],
    application: [
      "photo-1558769132-cb1aea458c5e",
      "photo-1483985988355-763728e1935b",
    ],
  },
};

const PRODUCT_PHOTOS: Record<
  string,
  { card: string; cover: string }
> = {
  "visual-identity-basics": {
    card: "photo-1561070791-2526d30994b5",
    cover: "photo-1558655146-d09347e92766",
  },
  "identity-bootcamp": {
    card: "photo-1586717791821-3f44a563fa4c",
    cover: "photo-1522071820081-009f0129c71c",
  },
  "colors-guide": {
    card: "photo-1541701494587-cb58502866ab",
    cover: "photo-1513364776144-60967b0f800f",
  },
  "print-files-guide": {
    card: "photo-1562654501-a0ccc0fc3fb1",
    cover: "photo-1497366216548-37526070297c",
  },
  "brand-style-sheet": {
    card: "photo-1618005182384-a83a8bd57fbe",
    cover: "photo-1558655146-9f40138edfeb",
  },
  "design-decisions-free": {
    card: "photo-1512820790803-83ca734da794",
    cover: "photo-1486312338219-ce68d2c6f44d",
  },
};

const AWARD_PHOTOS = [
  "photo-1567427017947-545c5f8d16ad",
  "photo-1578269174936-2709b6aeb913",
];

const FALLBACK_PHOTO = "photo-1618005182384-a83a8bd57fbe";

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "muntadhar-demo-restore/1.0",
      Accept: "image/*",
    },
  });
  if (!res.ok) {
    throw new Error(`تعذّر تحميل الصورة (${res.status}): ${url}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function downloadAndSave(options: {
  objectKey: string;
  photoId: string;
  width: number;
  height: number;
}): Promise<string> {
  const { objectKey, photoId, width, height } = options;
  const url = unsplashPhoto(photoId || FALLBACK_PHOTO, width * 2, height * 2);
  let bytes: Buffer;
  try {
    bytes = await fetchImageBuffer(url);
  } catch {
    bytes = await fetchImageBuffer(
      unsplashPhoto(FALLBACK_PHOTO, width * 2, height * 2),
    );
  }

  const absolute = path.join(publicMediaRootDir(), objectKey);
  await mkdir(path.dirname(absolute), { recursive: true });
  await sharp(bytes)
    .rotate()
    .resize(width, height, { fit: "cover", position: "centre" })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(absolute);

  return publicMediaUrlForKey(objectKey);
}

export type RestoreDemoResult = {
  projects: number;
  products: number;
  awards: number;
  stamp: string;
};

/** يعيد زراعة المحتوى التجريبي مع صور تصميم حقيقية من Unsplash */
export async function restoreDemoContent(
  prisma: PrismaClient,
): Promise<RestoreDemoResult> {
  // اسم فريد لكل تشغيل لكسر كاش المتصفح عند استبدال الصور
  const stamp = Date.now().toString(36);
  const galleryW = PROJECT_CASE_IMAGE.width;
  const galleryH = PROJECT_CASE_IMAGE.height;
  const cardW = ADMIN_MEDIA_SIZES.projectCard.width;
  const cardH = ADMIN_MEDIA_SIZES.projectCard.height;
  const productW = ADMIN_MEDIA_SIZES.productCard.width;
  const productH = ADMIN_MEDIA_SIZES.productCard.height;
  const awardW = ADMIN_MEDIA_SIZES.award.width;
  const awardH = ADMIN_MEDIA_SIZES.award.height;

  for (const [index, project] of projectsPlaceholder.entries()) {
    const photos = PROJECT_PHOTOS[project.slug] ?? {
      card: FALLBACK_PHOTO,
      logo: FALLBACK_PHOTO,
      cover: FALLBACK_PHOTO,
      brand: [FALLBACK_PHOTO, FALLBACK_PHOTO] as [string, string],
      application: [FALLBACK_PHOTO, FALLBACK_PHOTO] as [string, string],
    };
    const base = `${project.slug}-${stamp}`;

    const imageUrl = await downloadAndSave({
      objectKey: `projects/demo/${base}-card.jpg`,
      photoId: photos.card,
      width: cardW,
      height: cardH,
    });
    const logoImageUrl = await downloadAndSave({
      objectKey: `projects/demo/${base}-logo.jpg`,
      photoId: photos.logo,
      width: 1200,
      height: 1200,
    });
    const coverImageUrl = await downloadAndSave({
      objectKey: `projects/demo/${base}-cover.jpg`,
      photoId: photos.cover,
      width: galleryW,
      height: galleryH,
    });
    const brand1 = await downloadAndSave({
      objectKey: `projects/demo/${base}-brand-1.jpg`,
      photoId: photos.brand[0],
      width: galleryW,
      height: galleryH,
    });
    const brand2 = await downloadAndSave({
      objectKey: `projects/demo/${base}-brand-2.jpg`,
      photoId: photos.brand[1],
      width: galleryW,
      height: galleryH,
    });
    const app1 = await downloadAndSave({
      objectKey: `projects/demo/${base}-app-1.jpg`,
      photoId: photos.application[0],
      width: galleryW,
      height: galleryH,
    });
    const app2 = await downloadAndSave({
      objectKey: `projects/demo/${base}-app-2.jpg`,
      photoId: photos.application[1],
      width: galleryW,
      height: galleryH,
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
  for (const product of productsPlaceholder) {
    const photos = PRODUCT_PHOTOS[product.slug] ?? {
      card: FALLBACK_PHOTO,
      cover: FALLBACK_PHOTO,
    };
    const imageUrl = await downloadAndSave({
      objectKey: `products/demo/${product.slug}-${stamp}-card.jpg`,
      photoId: photos.card,
      width: productW,
      height: productH,
    });
    const coverImageUrl = await downloadAndSave({
      objectKey: `products/demo/${product.slug}-${stamp}-cover.jpg`,
      photoId: photos.cover,
      width: ADMIN_MEDIA_SIZES.productCover.width,
      height: ADMIN_MEDIA_SIZES.productCover.height,
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

  for (const booklet of bookletExtras) {
    if (booklet.slug === "colors-guide") continue;
    const photos = PRODUCT_PHOTOS[booklet.slug] ?? {
      card: FALLBACK_PHOTO,
      cover: FALLBACK_PHOTO,
    };
    const imageUrl = await downloadAndSave({
      objectKey: `products/demo/${booklet.slug}-${stamp}-card.jpg`,
      photoId: photos.card,
      width: productW,
      height: productH,
    });
    const coverImageUrl = await downloadAndSave({
      objectKey: `products/demo/${booklet.slug}-${stamp}-cover.jpg`,
      photoId: photos.cover,
      width: ADMIN_MEDIA_SIZES.productCover.width,
      height: ADMIN_MEDIA_SIZES.productCover.height,
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
      OR: [{ org: "جهة تجريبية" }, { title: { contains: "تجريبي" } }],
    },
  });

  let awardsCreated = 0;
  for (const [index, award] of demoAwards.entries()) {
    const imageUrl = await downloadAndSave({
      objectKey: `awards/demo/award-${index + 1}-${stamp}.jpg`,
      photoId: AWARD_PHOTOS[index] ?? FALLBACK_PHOTO,
      width: awardW,
      height: awardH,
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
    stamp,
  };
}
