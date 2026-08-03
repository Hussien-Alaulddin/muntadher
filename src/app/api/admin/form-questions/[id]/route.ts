import { NextResponse } from "next/server";
import { checkAdmin, requireDatabase } from "@/lib/admin-auth";
import { clampOrder } from "@/lib/admin-order";
import { withDbRetry } from "@/lib/prisma";

function asOptions(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  return items.length ? items : null;
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
    const body = (await request.json()) as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    if (typeof body.heading === "string") data.heading = body.heading.trim();
    if (typeof body.subtext === "string")
      data.subtext = body.subtext.trim() || null;
    if (typeof body.type === "string") data.type = body.type.trim();
    if (typeof body.required === "boolean") data.required = body.required;
    if (typeof body.enabled === "boolean") data.enabled = body.enabled;
    if (body.options !== undefined) data.options = asOptions(body.options);
    if (body.order !== undefined) {
      const count = await withDbRetry((db) => db.projectFormQuestion.count());
      data.order = clampOrder(body.order, Math.max(1, count));
    }
    if (typeof body.key === "string" && body.key.trim()) {
      data.key = body.key.trim().replace(/\s+/g, "_").toLowerCase();
    }

    const item = await withDbRetry((db) =>
      db.projectFormQuestion.update({ where: { id }, data }),
    );

    return NextResponse.json({
      item: { ...item, options: asOptions(item.options) },
    });
  } catch (error) {
    console.error("[admin/form-questions:patch]", error);
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
      db.projectFormQuestion.delete({ where: { id } }),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/form-questions:delete]", error);
    return NextResponse.json({ message: "تعذّر الحذف" }, { status: 500 });
  }
}
