import { NextResponse } from "next/server";
import { checkAdmin, requireDatabase } from "@/lib/admin-auth";
import { withDbRetry } from "@/lib/prisma";
import { projectFormQuestionsSeed } from "@/lib/project-form";

function asOptions(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  return items.length ? items : null;
}

export async function GET(request: Request) {
  const denied = await checkAdmin(request);
  if (denied) return denied;
  const { error } = requireDatabase();
  if (error) return error;

  try {
    let items = await withDbRetry((db) =>
      db.projectFormQuestion.findMany({ orderBy: { order: "asc" } }),
    );

    if (items.length === 0) {
      await withDbRetry((db) =>
        db.projectFormQuestion.createMany({
          data: projectFormQuestionsSeed.map((q) => ({
            key: q.key,
            heading: q.heading,
            subtext: q.subtext ?? null,
            type: q.type,
            required: q.required,
            options: q.options ?? undefined,
            order: q.order,
            enabled: true,
          })),
        }),
      );
      items = await withDbRetry((db) =>
        db.projectFormQuestion.findMany({ orderBy: { order: "asc" } }),
      );
    }

    return NextResponse.json({
      items: items.map((item) => ({
        ...item,
        options: asOptions(item.options),
      })),
    });
  } catch (error) {
    console.error("[admin/form-questions:get]", error);
    return NextResponse.json({ message: "تعذّر التحميل" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await checkAdmin(request);
  if (denied) return denied;
  const { error } = requireDatabase();
  if (error) return error;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const key = String(body.key ?? "")
      .trim()
      .replace(/\s+/g, "_")
      .toLowerCase();
    const heading = String(body.heading ?? "").trim();
    const type = String(body.type ?? "text").trim();
    if (!key || !heading) {
      return NextResponse.json(
        { message: "المفتاح والعنوان مطلوبان" },
        { status: 422 },
      );
    }

    const item = await withDbRetry((db) =>
      db.projectFormQuestion.create({
        data: {
          key,
          heading,
          subtext: String(body.subtext ?? "").trim() || null,
          type,
          required: Boolean(body.required ?? true),
          options: asOptions(body.options) ?? undefined,
          order: Number(body.order) || 1,
          enabled: body.enabled !== false,
        },
      }),
    );

    return NextResponse.json({
      item: { ...item, options: asOptions(item.options) },
    });
  } catch (error) {
    console.error("[admin/form-questions:post]", error);
    return NextResponse.json({ message: "تعذّر الحفظ" }, { status: 500 });
  }
}
