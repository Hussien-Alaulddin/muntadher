import { NextResponse } from "next/server";
import { checkAdmin, requireDatabase } from "@/lib/admin-auth";
import { withDbRetry } from "@/lib/prisma";

export async function GET(request: Request) {
  const denied = await checkAdmin(request);
  if (denied) return denied;
  const { error } = requireDatabase();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  try {
    const items = await withDbRetry((db) =>
      db.projectFormResponse.findMany({
        orderBy: { createdAt: "desc" },
      }),
    );

    if (format === "csv") {
      const header = [
        "الاسم",
        "نوع المساعدة",
        "البريد",
        "واتساب",
        "انستجرام",
        "الحالة",
        "التاريخ",
      ];
      const lines = items.map((item) =>
        [
          item.name ?? "",
          item.helpType ?? "",
          item.contactEmail ?? "",
          item.contactWhatsapp ?? "",
          item.contactInstagram ?? "",
          item.status,
          item.createdAt.toISOString(),
        ]
          .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
          .join(","),
      );
      const csv = `\uFEFF${header.join(",")}\n${lines.join("\n")}`;
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="form-responses.csv"`,
        },
      });
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[admin/form-responses:get]", error);
    return NextResponse.json({ message: "تعذّر التحميل" }, { status: 500 });
  }
}
