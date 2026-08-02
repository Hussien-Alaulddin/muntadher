import { NextResponse } from "next/server";
import { checkAdmin, requireDatabase } from "@/lib/admin-auth";
import { withDbRetry } from "@/lib/prisma";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await checkAdmin(request);
  if (denied) return denied;
  const { error } = requireDatabase();
  if (error) return error;

  const { id } = await context.params;

  try {
    const item = await withDbRetry((db) =>
      db.projectFormResponse.findUnique({ where: { id } }),
    );
    if (!item) {
      return NextResponse.json({ message: "غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (error) {
    console.error("[admin/form-responses:get-one]", error);
    return NextResponse.json({ message: "تعذّر التحميل" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await checkAdmin(request);
  if (denied) return denied;
  const { error } = requireDatabase();
  if (error) return error;

  const { id } = await context.params;

  try {
    const body = (await request.json()) as { status?: string };
    const status = String(body.status ?? "").trim();
    if (!status) {
      return NextResponse.json({ message: "الحالة مطلوبة" }, { status: 422 });
    }

    const item = await withDbRetry((db) =>
      db.projectFormResponse.update({
        where: { id },
        data: { status },
      }),
    );
    return NextResponse.json({ item });
  } catch (error) {
    console.error("[admin/form-responses:patch]", error);
    return NextResponse.json({ message: "تعذّر التحديث" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await checkAdmin(request);
  if (denied) return denied;
  const { error } = requireDatabase();
  if (error) return error;

  const { id } = await context.params;

  try {
    await withDbRetry((db) =>
      db.projectFormResponse.delete({ where: { id } }),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/form-responses:delete]", error);
    return NextResponse.json({ message: "تعذّر الحذف" }, { status: 500 });
  }
}
