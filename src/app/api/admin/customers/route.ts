import { NextResponse } from "next/server";
import { checkAdmin, requireDatabase } from "@/lib/admin-auth";
import { adminRouteError } from "@/lib/admin-route-error";
import { locationLabel } from "@/lib/client-geo";
import { withDbRetry } from "@/lib/prisma";

export async function GET(request: Request) {
  const denied = await checkAdmin(request);
  if (denied) return denied;

  const { error } = requireDatabase();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");

    const customers = await withDbRetry((prisma) => {
      if (!prisma.customer) {
        throw new Error(
          "نموذج العملاء غير محمّل — أعد تشغيل الخادم بعد prisma generate",
        );
      }
      return prisma.customer.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          country: true,
          region: true,
          city: true,
          countryCode: true,
          createdAt: true,
          _count: { select: { entitlements: true } },
        },
      });
    });

    if (format === "csv") {
      const header =
        "الاسم,البريد,الهاتف,البلد,المحافظة,المدينة,عدد الكتيبات,تاريخ التسجيل";
      const rows = customers.map((c) => {
        const phone = c.phone ? `"${c.phone.replace(/"/g, '""')}"` : "";
        const name = `"${c.name.replace(/"/g, '""')}"`;
        const country = c.country ? `"${c.country.replace(/"/g, '""')}"` : "";
        const region = c.region ? `"${c.region.replace(/"/g, '""')}"` : "";
        const city = c.city ? `"${c.city.replace(/"/g, '""')}"` : "";
        const date = c.createdAt.toISOString().slice(0, 10);
        return `${name},${c.email},${phone},${country},${region},${city},${c._count.entitlements},${date}`;
      });
      const bom = "\uFEFF";
      const csv = bom + [header, ...rows].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="customers-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({
      items: customers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        country: c.country,
        region: c.region,
        city: c.city,
        countryCode: c.countryCode,
        location: locationLabel(c),
        entitlementsCount: c._count.entitlements,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return adminRouteError(err);
  }
}
