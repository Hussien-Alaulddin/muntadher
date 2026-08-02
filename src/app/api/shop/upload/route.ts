import { NextResponse } from "next/server";
import { customerIdFromRequest } from "@/lib/customer-auth";
import {
  buildObjectKey,
  isAllowedMedia,
  maxBytesForMime,
  resolveUploadMime,
} from "@/lib/media-upload";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { uploadMediaObject } from "@/lib/upload-media";

export const runtime = "nodejs";

/** رفع صورة إيصال التحويل — يُحفظ في تخزين خاص */
export async function POST(request: Request) {
  const customerId = customerIdFromRequest(request);
  if (!customerId) {
    return NextResponse.json(
      { message: "يلزم تسجيل الدخول أولاً" },
      { status: 401 },
    );
  }

  const limited = rateLimit(
    `shop-upload:${customerId}:${clientIp(request)}`,
    20,
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

  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "لم يتم إرسال ملف" }, { status: 400 });
    }

    if (!isAllowedMedia(file.type, "image")) {
      return NextResponse.json(
        { message: "يُسمح بصور فقط (JPG, PNG, WebP, GIF)" },
        { status: 415 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const contentType = resolveUploadMime(file.type, bytes, "image");
    if (!contentType) {
      return NextResponse.json(
        { message: "محتوى الصورة غير صالح" },
        { status: 415 },
      );
    }

    const maxBytes = maxBytesForMime(contentType);
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          message: `حجم الملف كبير جداً (الحد ${Math.round(maxBytes / (1024 * 1024))}MB)`,
        },
        { status: 413 },
      );
    }

    const objectKey = buildObjectKey(
      `purchase-receipts/${customerId}`,
      contentType,
      file.name,
    );

    const uploaded = await uploadMediaObject({
      objectKey,
      bytes,
      contentType,
      upsert: false,
    });

    return NextResponse.json({ url: uploaded.url });
  } catch (error) {
    console.error("[shop/upload]", error);
    return NextResponse.json(
      {
        message:
          "تعذّر رفع الملف",
      },
      { status: 500 },
    );
  }
}
