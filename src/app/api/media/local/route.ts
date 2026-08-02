import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { customerIdFromRequest } from "@/lib/customer-auth";
import {
  isPrivateObjectKey,
  localPrivateFileExists,
  nodeStreamToWeb,
  openLocalPrivateReadStream,
} from "@/lib/media-access";
import { verifySignedLocalMediaParams } from "@/lib/media-local-sign";
import { mediaObjectBelongsToProduct } from "@/lib/media-product-bind";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * خدمة ملفات التخزين المحلي الخاص.
 * للدروس/الملفات: يتطلب توقيع HMAC + entitlement + ارتباط الملف بالمنتج.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key")?.trim() ?? "";
  const productId = searchParams.get("productId")?.trim() ?? "";
  const exp = searchParams.get("exp")?.trim() ?? "";
  const sig = searchParams.get("sig")?.trim() ?? "";

  if (!key || key.includes("..") || key.startsWith("/")) {
    return NextResponse.json({ message: "طلب غير صالح" }, { status: 400 });
  }

  if (!isPrivateObjectKey(key)) {
    return NextResponse.json({ message: "الملف غير خاص" }, { status: 400 });
  }

  if (!localPrivateFileExists(key)) {
    return NextResponse.json({ message: "الملف غير موجود" }, { status: 404 });
  }

  const allowed = await canAccessPrivateKey(request, key, productId, exp, sig);
  if (!allowed) {
    return NextResponse.json({ message: "غير مصرّح" }, { status: 403 });
  }

  const stream = openLocalPrivateReadStream(key);
  if (!stream) {
    return NextResponse.json({ message: "الملف غير موجود" }, { status: 404 });
  }

  const filename = key.split("/").pop() || "file";
  const safeFilename = filename.replace(/[^\w.\-()\u0600-\u06FF]+/g, "_").slice(0, 120);
  return new NextResponse(nodeStreamToWeb(stream), {
    headers: {
      "Content-Type": guessContentType(filename),
      "Content-Disposition": `inline; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store",
    },
  });
}

async function canAccessPrivateKey(
  request: Request,
  key: string,
  productId: string,
  exp: string,
  sig: string,
): Promise<boolean> {
  if ((await checkAdmin(request)) === null) {
    // الأدمن: يكفي جلسة صالحة؛ التوقيع اختياري للمعاينة المباشرة
    return true;
  }

  const customerId = customerIdFromRequest(request);
  if (!customerId) return false;

  if (key.startsWith("purchase-receipts/")) {
    if (!key.startsWith(`purchase-receipts/${customerId}/`)) return false;
    // الإيصال للمالك: إن وُجد توقيع فتحقّق منه، وإلا اسمح للمالك فقط
    if (sig || exp) {
      return verifySignedLocalMediaParams({
        key,
        productId: "",
        exp,
        sig,
      });
    }
    return true;
  }

  if (
    key.startsWith("course-lessons/") ||
    key.startsWith("course-attachments/") ||
    key.startsWith("products/files/")
  ) {
    if (!productId || !exp || !sig) return false;
    if (
      !verifySignedLocalMediaParams({
        key,
        productId,
        exp,
        sig,
      })
    ) {
      return false;
    }

    const prisma = getPrisma();
    if (!prisma) return false;

    const entitlement = await prisma.customerEntitlement.findUnique({
      where: {
        customerId_productId: { customerId, productId },
      },
      select: { id: true },
    });
    if (!entitlement) return false;

    return mediaObjectBelongsToProduct(prisma, productId, key);
  }

  return false;
}

function guessContentType(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "pdf":
      return "application/pdf";
    case "zip":
      return "application/zip";
    default:
      return "application/octet-stream";
  }
}
