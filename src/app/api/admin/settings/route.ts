import { NextResponse } from "next/server";
import { checkAdmin, requireDatabase } from "@/lib/admin-auth";
import { adminRouteError } from "@/lib/admin-route-error";
import { deleteRemovedManagedMedia } from "@/lib/delete-record-media";
import { withDbRetry } from "@/lib/prisma";
import { revalidateSite } from "@/lib/revalidate-site";

const settingsFields = [
  "designerName",
  "siteName",
  "siteTagline",
  "avatarUrl",
  "heroImageUrl",
  "brandMarkUrl",
  "navbarLogoUrl",
  "footerLogoUrl",
  "footerDescription",
  "availableForWork",
  "contactEmail",
  "contactPhone",
  "contactLocation",
  "whatsappUrl",
  "instagramUrl",
  "facebookUrl",
  "telegramUrl",
  "qiCardAccount",
  "zainCashAccount",
] as const;

const bannerFields = [
  "enabled",
  "badgeLabel",
  "title",
  "contentType",
  "ctaLabel",
  "href",
  "imageUrl",
] as const;

function pick(payload: Record<string, unknown>, fields: readonly string[]) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => fields.includes(key)),
  );
}

export async function GET(request: Request) {
  const unauthorized = await checkAdmin(request);
  if (unauthorized) return unauthorized;

  const { error } = requireDatabase();
  if (error) return error;

  try {
    const [settings, banner] = await withDbRetry((prisma) =>
      Promise.all([
        prisma.siteSettings.findUnique({ where: { id: "default" } }),
        prisma.featuredBanner.findUnique({ where: { id: "default" } }),
      ]),
    );

    return NextResponse.json({ settings, banner });
  } catch (err) {
    return adminRouteError(err);
  }
}

/** يقبل { settings: {...}, banner: {...} } — الاثنين اختياريان */
export async function PATCH(request: Request) {
  const unauthorized = await checkAdmin(request);
  if (unauthorized) return unauthorized;

  const { error } = requireDatabase();
  if (error) return error;

  try {
    const payload = (await request.json()) as {
      settings?: Record<string, unknown>;
      banner?: Record<string, unknown>;
    };

    const settingsData = pick(payload.settings ?? {}, settingsFields);
    const bannerData = pick(payload.banner ?? {}, bannerFields);

    const [settings, banner, previous] = await withDbRetry(async (prisma) => {
      const [prevSettings, prevBanner] = await Promise.all([
        prisma.siteSettings.findUnique({ where: { id: "default" } }),
        prisma.featuredBanner.findUnique({ where: { id: "default" } }),
      ]);

      const nextSettings = Object.keys(settingsData).length
        ? await prisma.siteSettings.upsert({
            where: { id: "default" },
            create: { id: "default", ...settingsData },
            update: settingsData,
          })
        : prevSettings;

      const nextBanner = Object.keys(bannerData).length
        ? await prisma.featuredBanner.upsert({
            where: { id: "default" },
            create: { id: "default", ...bannerData },
            update: bannerData,
          })
        : prevBanner;

      return [nextSettings, nextBanner, { prevSettings, prevBanner }] as const;
    });

    if (Object.keys(settingsData).length) {
      await deleteRemovedManagedMedia(previous.prevSettings, settings);
    }
    if (Object.keys(bannerData).length) {
      await deleteRemovedManagedMedia(previous.prevBanner, banner);
    }

    revalidateSite();

    return NextResponse.json({ settings, banner });
  } catch (err) {
    return adminRouteError(err);
  }
}
