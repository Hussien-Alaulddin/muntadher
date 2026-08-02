import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { checkAdmin, requireDatabase } from "@/lib/admin-auth";
import { adminRouteError } from "@/lib/admin-route-error";
import { withDbRetry } from "@/lib/prisma";

const settingsFields = [
  "designerName",
  "siteName",
  "avatarUrl",
  "heroImageUrl",
  "availableForWork",
  "contactEmail",
  "whatsappUrl",
  "projectRequestFormUrl",
  "externalPortfolioUrl",
  "qiCardAccount",
  "zainCashAccount",
] as const;

const bannerFields = ["enabled", "title", "contentType", "href"] as const;

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

    const [settings, banner] = await withDbRetry(async (prisma) => {
      const nextSettings = Object.keys(settingsData).length
        ? await prisma.siteSettings.upsert({
            where: { id: "default" },
            create: { id: "default", ...settingsData },
            update: settingsData,
          })
        : await prisma.siteSettings.findUnique({ where: { id: "default" } });

      const nextBanner = Object.keys(bannerData).length
        ? await prisma.featuredBanner.upsert({
            where: { id: "default" },
            create: { id: "default", ...bannerData },
            update: bannerData,
          })
        : await prisma.featuredBanner.findUnique({ where: { id: "default" } });

      return [nextSettings, nextBanner] as const;
    });

    revalidatePath("/");
    revalidatePath("/projects");
    revalidateTag("site-content");

    return NextResponse.json({ settings, banner });
  } catch (err) {
    return adminRouteError(err);
  }
}
