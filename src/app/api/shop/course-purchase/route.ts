import { NextResponse } from "next/server";
import { customerIdFromRequest } from "@/lib/customer-auth";
import { getPrisma, withDbRetry } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isAllowedReceiptImageUrl } from "@/lib/storage-url";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const customerId = customerIdFromRequest(request);
  if (!customerId) {
    return NextResponse.json(
      { message: "يلزم تسجيل الدخول أولاً" },
      { status: 401 },
    );
  }

  const limited = rateLimit(
    `course-purchase:${customerId}:${clientIp(request)}`,
    8,
    15 * 60_000,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { message: "محاولات كثيرة — حاول لاحقاً" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { message: "الخدمة غير متاحة مؤقتاً، حاول بعد قليل" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      productId?: string;
      whatsappPhone?: string;
      receiptImageUrl?: string;
    };

    const productId = String(body.productId ?? "").trim();
    const whatsappPhone = String(body.whatsappPhone ?? "").trim();
    const receiptImageUrl = String(body.receiptImageUrl ?? "").trim();

    if (!productId) {
      return NextResponse.json({ message: "بيانات الطلب غير مكتملة" }, { status: 400 });
    }
    if (!whatsappPhone || whatsappPhone.length < 8) {
      return NextResponse.json(
        { message: "أدخل رقم واتساب صالحاً" },
        { status: 400 },
      );
    }
    if (!receiptImageUrl) {
      return NextResponse.json(
        { message: "ارفع صورة التحويل المالي" },
        { status: 400 },
      );
    }
    if (!isAllowedReceiptImageUrl(receiptImageUrl, customerId)) {
      return NextResponse.json(
        { message: "رابط صورة التحويل غير صالح — أعد رفع الإيصال" },
        { status: 400 },
      );
    }

    const product = await withDbRetry((db) =>
      db.product.findFirst({
        where: { id: productId, published: true, group: "core" },
        select: { id: true, title: true },
      }),
    );

    if (!product) {
      return NextResponse.json({ message: "الدورة غير موجودة" }, { status: 404 });
    }

    const existing = await withDbRetry((db) =>
      db.coursePurchaseRequest.findFirst({
        where: {
          customerId,
          productId,
          status: "pending",
        },
        select: { id: true },
      }),
    );

    if (existing) {
      return NextResponse.json(
        {
          message:
            "لديك طلب شراء قيد المراجعة لهذه الدورة. سنراجع طلبك قريباً.",
        },
        { status: 409 },
      );
    }

    const entitlement = await withDbRetry((db) =>
      db.customerEntitlement.findUnique({
        where: {
          customerId_productId: { customerId, productId },
        },
        select: { id: true },
      }),
    );

    if (entitlement) {
      return NextResponse.json(
        { message: "لديك صلاحية الوصول لهذه الدورة مسبقاً" },
        { status: 409 },
      );
    }

    const requestRow = await withDbRetry((db) =>
      db.coursePurchaseRequest.create({
        data: {
          customerId,
          productId,
          whatsappPhone,
          receiptImageUrl,
          status: "pending",
        },
        select: { id: true },
      }),
    );

    return NextResponse.json({
      ok: true,
      id: requestRow.id,
      message:
        "تم إرسال طلبك بنجاح وسيتم مراجعته قريباً وفتح الدورة لك.",
    });
  } catch {
    return NextResponse.json(
      { message: "تعذّر إرسال الطلب" },
      { status: 500 },
    );
  }
}
