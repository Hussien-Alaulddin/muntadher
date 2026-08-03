import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  const limited = rateLimit(`newsletter:${clientIp(request)}`, 10, 60 * 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { message: "محاولات كثيرة — حاول لاحقاً" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  let email: unknown;

  try {
    ({ email } = (await request.json()) as { email?: unknown });
  } catch {
    return NextResponse.json({ message: "طلب غير صالح" }, { status: 400 });
  }

  if (typeof email !== "string" || !emailPattern.test(email.trim())) {
    return NextResponse.json(
      { message: "الرجاء إدخال بريد إلكتروني صحيح" },
      { status: 422 },
    );
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { message: "تعذّر الاشتراك حالياً، حاول لاحقاً" },
      { status: 503 },
    );
  }

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email: email.trim().toLowerCase() },
      create: { email: email.trim().toLowerCase() },
      update: {},
    });
  } catch (error) {
    console.error("[newsletter] فشل تسجيل الاشتراك:", error);
    return NextResponse.json(
      { message: "تعذّر إكمال الاشتراك، جرّب مرة ثانية" },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "تم تسجيل بريدك، شكراً لك." });
}
