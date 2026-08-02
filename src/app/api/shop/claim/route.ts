import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { customerIdFromRequest } from "@/lib/customer-auth";
import { isFreePrice } from "@/lib/product-files";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/** الحصول على كتيّب مجاني — يمنح صلاحية التحميل ويزيله من السلة */
export async function POST(request: Request) {
  const customerId = customerIdFromRequest(request);
  if (!customerId) {
    return NextResponse.json(
      { message: "يجب تسجيل الدخول أولاً", requireAuth: true },
      { status: 401 },
    );
  }

  const limited = rateLimit(
    `shop-claim:${customerId}:${clientIp(request)}`,
    30,
    60 * 60_000,
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
      { message: "قاعدة البيانات غير متاحة" },
      { status: 503 },
    );
  }

  let body: { productId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "طلب غير صالح" }, { status: 400 });
  }

  const productId = typeof body.productId === "string" ? body.productId : "";
  if (!productId) {
    return NextResponse.json({ message: "المنتج مطلوب" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, published: true, group: "resource" },
  });
  if (!product) {
    return NextResponse.json({ message: "المنتج غير متاح" }, { status: 404 });
  }

  if (!isFreePrice(product.price)) {
    return NextResponse.json(
      { message: "هذا المنتج مدفوع — بوابة الدفع قريباً" },
      { status: 402 },
    );
  }

  await prisma.$transaction([
    prisma.customerEntitlement.upsert({
      where: {
        customerId_productId: { customerId, productId },
      },
      create: { customerId, productId },
      update: {},
    }),
    prisma.cartItem.deleteMany({ where: { customerId, productId } }),
    prisma.product.update({
      where: { id: productId },
      data: { downloadsCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ ok: true, entitled: true });
}
