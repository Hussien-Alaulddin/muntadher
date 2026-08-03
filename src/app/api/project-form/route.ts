import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getPrisma, withDbRetry } from "@/lib/prisma";
import { getPublicProjectForm } from "@/lib/get-project-form";
import { projectFormQuestionsSeed } from "@/lib/project-form";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const data = await getPublicProjectForm();
  return NextResponse.json(data);
}

type ContactAnswers = {
  email?: string;
  whatsapp?: string;
  instagram?: string;
};

export async function POST(request: Request) {
  const limited = rateLimit(`project-form:${clientIp(request)}`, 8, 60 * 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { message: "محاولات كثيرة — حاول لاحقاً" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  let body: { answers?: Record<string, unknown> };
  try {
    body = (await request.json()) as { answers?: Record<string, unknown> };
  } catch {
    return NextResponse.json({ message: "طلب غير صالح" }, { status: 400 });
  }

  const answers = body.answers;
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ message: "الإجابات ناقصة" }, { status: 422 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { message: "تعذّر إرسال الطلب حالياً، حاول لاحقاً" },
      { status: 503 },
    );
  }

  try {
    const formDb = prisma as {
      projectFormQuestion?: {
        findMany: (args: unknown) => Promise<
          Array<{
            key: string;
            heading: string;
            type: string;
            required: boolean;
            options: unknown;
          }>
        >;
      };
      projectFormResponse?: {
        create: (args: unknown) => Promise<unknown>;
      };
    };

    let active: Array<{
      key: string;
      heading: string;
      type: string;
      required: boolean;
      options?: unknown;
    }> = projectFormQuestionsSeed;

    if (formDb.projectFormQuestion?.findMany) {
      const questions = await withDbRetry((db) =>
        (db as typeof formDb).projectFormQuestion!.findMany({
          where: { enabled: true },
          orderBy: { order: "asc" },
        }),
      );
      if (questions.length > 0) active = questions;
    }

    for (const q of active) {
      const value = answers[q.key];
      if (!q.required) continue;

      if (q.type === "contact_methods") {
        const contact = (value ?? {}) as ContactAnswers;
        const hasAny =
          Boolean(contact.email?.trim()) ||
          Boolean(contact.whatsapp?.trim()) ||
          Boolean(contact.instagram?.trim());
        if (!hasAny) {
          return NextResponse.json(
            { message: "أدخل وسيلة تواصل واحدة على الأقل" },
            { status: 422 },
          );
        }
        continue;
      }

      if (q.type === "multi_select") {
        const selected = Array.isArray(value)
          ? value.filter((item) => typeof item === "string" && item.trim())
          : [];
        if (selected.length === 0) {
          return NextResponse.json(
            { message: `السؤال مطلوب: ${q.heading}` },
            { status: 422 },
          );
        }
        continue;
      }

      if (typeof value !== "string" || !value.trim()) {
        return NextResponse.json(
          { message: `السؤال مطلوب: ${q.heading}` },
          { status: 422 },
        );
      }
    }

    const name =
      typeof answers.name === "string" ? answers.name.trim() : null;
    const helpType =
      typeof answers.help_type === "string" ? answers.help_type.trim() : null;
    const contact = (answers.contact ?? {}) as ContactAnswers;

    if (!formDb.projectFormResponse?.create) {
      return NextResponse.json(
        {
          message:
            "خدمة الاستمارة تحتاج إعادة تشغيل السيرفر بعد تحديث قاعدة البيانات",
        },
        { status: 503 },
      );
    }

    await withDbRetry((db) =>
      (db as typeof formDb).projectFormResponse!.create({
        data: {
          answers: answers as Prisma.InputJsonValue,
          name,
          helpType,
          contactEmail: contact.email?.trim() || null,
          contactWhatsapp: contact.whatsapp?.trim() || null,
          contactInstagram: contact.instagram?.trim() || null,
        },
      }),
    );

    return NextResponse.json({
      message: "تم إرسال طلبك بنجاح. سأتواصل معك قريباً.",
    });
  } catch (error) {
    console.error("[project-form:post]", error);
    return NextResponse.json(
      { message: "تعذّر إرسال الطلب، جرّب مرة ثانية" },
      { status: 500 },
    );
  }
}
