import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { customerIdFromRequest } from "@/lib/customer-auth";
import {
  createSignedMediaUrl,
  DOWNLOAD_SIGNED_URL_SECONDS,
  resolveMediaRef,
} from "@/lib/media-access";
import { createSignedLocalMediaUrl } from "@/lib/media-local-sign";
import { mediaObjectBelongsToProduct } from "@/lib/media-product-bind";
import { parseProductFiles } from "@/lib/product-files";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/** تحميل ملف كتيّب — صلاحية + رابط موقّت قصير العمر */
export async function GET(request: Request) {
  const customerId = customerIdFromRequest(request);
  if (!customerId) {
    return NextResponse.json(
      { message: "يجب تسجيل الدخول أولاً", requireAuth: true },
      { status: 401 },
    );
  }

  const limited = rateLimit(
    `shop-download:${customerId}:${clientIp(request)}`,
    60,
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

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const fileIndex = Number(searchParams.get("file") ?? "0");

  if (!productId || !Number.isFinite(fileIndex) || fileIndex < 0) {
    return NextResponse.json({ message: "طلب غير صالح" }, { status: 400 });
  }

  const entitlement = await prisma.customerEntitlement.findUnique({
    where: {
      customerId_productId: { customerId, productId },
    },
  });

  if (!entitlement) {
    return NextResponse.json(
      { message: "لا توجد صلاحية لتحميل هذا الملف", requireClaim: true },
      { status: 403 },
    );
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, published: true, group: "resource" },
    select: { files: true },
  });
  if (!product) {
    return NextResponse.json({ message: "المنتج غير متاح" }, { status: 404 });
  }

  const files = parseProductFiles(product.files);
  const file = files[fileIndex];
  if (!file) {
    return NextResponse.json({ message: "الملف غير موجود" }, { status: 404 });
  }

  const ref = resolveMediaRef(file.url);
  if (ref?.objectKey) {
    const belongs = await mediaObjectBelongsToProduct(
      prisma,
      productId,
      ref.objectKey,
    );
    if (!belongs) {
      return NextResponse.json({ message: "الملف غير مرتبط بهذا المنتج" }, { status: 403 });
    }
  }

  if (ref?.localPrivate || file.url.startsWith("/api/media/local")) {
    const local = createSignedLocalMediaUrl({
      objectKey: ref?.objectKey || "",
      productId,
      expiresInSeconds: DOWNLOAD_SIGNED_URL_SECONDS,
    });
    if (!local) {
      return NextResponse.json(
        { message: "تعذّر تجهيز رابط التحميل" },
        { status: 500 },
      );
    }
    return NextResponse.redirect(new URL(local, request.url));
  }

  const signed = await createSignedMediaUrl(
    file.url,
    DOWNLOAD_SIGNED_URL_SECONDS,
  );
  if (!signed) {
    return NextResponse.json(
      { message: "تعذّر تجهيز رابط التحميل" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(signed);
}
