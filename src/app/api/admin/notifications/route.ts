import { NextResponse } from "next/server";
import { checkAdmin, requireDatabase } from "@/lib/admin-auth";
import { withDbRetry } from "@/lib/prisma";

/** إشعارات لوحة التحكم — أحدث العناصر فقط لتقليل الحمل */
export async function GET(request: Request) {
  const denied = await checkAdmin(request);
  if (denied) return denied;
  const { error } = requireDatabase();
  if (error) return error;

  try {
    const [formRows, customers] = await withDbRetry(async (db) => {
      const forms = db.projectFormResponse.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
        select: {
          id: true,
          name: true,
          helpType: true,
          createdAt: true,
        },
      });
      const customerIds = db.customer
        ? db.customer.findMany({
            select: { id: true },
            orderBy: { createdAt: "desc" },
            take: 80,
          })
        : Promise.resolve([] as Array<{ id: string }>);

      return Promise.all([forms, customerIds]);
    });

    const ids = formRows.map((row) => row.id);

    return NextResponse.json({
      formResponses: {
        count: ids.length,
        ids,
        items: formRows.slice(0, 10),
      },
      customers: {
        count: customers.length,
        ids: customers.map((row) => row.id),
      },
    });
  } catch (err) {
    console.error("[admin/notifications:get]", err);
    return NextResponse.json({ message: "تعذّر التحميل" }, { status: 500 });
  }
}
