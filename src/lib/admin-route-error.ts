import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

/** يحوّل أخطاء Prisma/الشبكة إلى رد JSON واضح بدل 500 خام */
export function adminRouteError(error: unknown) {
  console.error("[admin-api]", error);

  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    const message = error instanceof Error ? error.message : "";
    const poolExhausted = /max clients reached|EMAXCONNSESSION|P1001/i.test(
      message,
    );

    return NextResponse.json(
      {
        message: poolExhausted
          ? "قاعدة البيانات مشغولة حالياً. حاول مرة أخرى بعد لحظات."
          : `خطأ في قاعدة البيانات (${
              error instanceof Prisma.PrismaClientKnownRequestError
                ? error.code
                : error instanceof Prisma.PrismaClientInitializationError
                  ? "INIT"
                  : "DB"
            }). إن كانت الجداول فارغة بعد النقل فهذا طبيعي حتى ترحيل البيانات.`,
        code:
          error instanceof Prisma.PrismaClientKnownRequestError
            ? error.code
            : "DB",
        detail:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message.slice(0, 300)
              : undefined
            : undefined,
      },
      { status: 503 },
    );
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        message:
          "نموذج قاعدة البيانات غير محدّث. أعد تشغيل الخادم بعد prisma generate.",
        code: "VALIDATION",
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { message: "حدث خطأ غير متوقع في الخادم" },
    { status: 500 },
  );
}
