import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import {
  buildObjectKey,
  isAllowedMedia,
  maxBytesForMime,
  normalizeAdminUploadFolder,
  resolveUploadMime,
  type MediaKind,
} from "@/lib/media-upload";
import {
  createSignedMediaUrl,
  isPrivateObjectKey,
  RECEIPT_SIGNED_URL_SECONDS,
} from "@/lib/media-access";
import { deleteStorageObjectByUrl } from "@/lib/supabase-admin";
import { uploadMediaObject } from "@/lib/upload-media";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unauthorized = await checkAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const form = await request.formData();
    const file = form.get("file");
    const folder = normalizeAdminUploadFolder(
      String(form.get("folder") ?? "general"),
    );
    const accept = (String(form.get("accept") ?? "both") ||
      "both") as MediaKind;
    const replaceUrl = String(form.get("replaceUrl") ?? "").trim();

    if (!folder) {
      return NextResponse.json(
        { message: "مجلد الرفع غير مسموح" },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "لم يتم إرسال ملف" }, { status: 400 });
    }

    if (!isAllowedMedia(file.type, accept)) {
      return NextResponse.json(
        {
          message:
            accept === "image"
              ? "يُسمح بصور فقط (JPG, PNG, WebP, GIF, AVIF)"
              : accept === "video"
                ? "يُسمح بفيديو فقط (MP4, WebM, MOV)"
                : accept === "file"
                  ? "يُسمح بملفات PDF أو ZIP فقط"
                  : "نوع الملف غير مدعوم",
        },
        { status: 415 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const contentType = resolveUploadMime(file.type, bytes, accept);
    if (!contentType) {
      return NextResponse.json(
        { message: "محتوى الملف لا يطابق النوع المسموح" },
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

    const objectKey = buildObjectKey(folder, contentType, file.name);
    const uploaded = await uploadMediaObject({
      objectKey,
      bytes,
      contentType,
      upsert: false,
    });

    if (replaceUrl) {
      await deleteStorageObjectByUrl(replaceUrl);
    }

    const previewUrl = isPrivateObjectKey(objectKey)
      ? (await createSignedMediaUrl(
          uploaded.url,
          RECEIPT_SIGNED_URL_SECONDS,
        )) || uploaded.url
      : uploaded.url;

    return NextResponse.json({
      url: uploaded.url,
      previewUrl,
      storage: uploaded.storage,
      bucket: uploaded.bucket,
      contentType,
      ...(uploaded.storage === "local"
        ? {
            warning:
              "تم الحفظ محلياً. لرفع دائم على Supabase أضف SUPABASE_SERVICE_ROLE_KEY وBUCKET_NAME في .env",
          }
        : {}),
    });
  } catch (error) {
    console.error("[upload]", error);
    return NextResponse.json(
      { message: "تعذّر رفع الملف" },
      { status: 500 },
    );
  }
}

/** حذف ملف من Storage بالرابط المحفوظ */
export async function DELETE(request: Request) {
  const unauthorized = await checkAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const body = (await request.json().catch(() => null)) as {
      url?: string;
    } | null;
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    if (!url) {
      return NextResponse.json({ message: "الرابط مطلوب" }, { status: 400 });
    }

    const deleted = await deleteStorageObjectByUrl(url);
    if (!deleted && url.startsWith("/uploads/")) {
      return NextResponse.json({
        ok: true,
        deleted: false,
        message: "التخزين المحلي — احذف الملف يدوياً إن لزم",
      });
    }

    if (!deleted) {
      return NextResponse.json(
        {
          message:
            "تعذّر حذف الملف من Storage (قد لا يكون من bucket الموقع)",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, deleted: true });
  } catch (error) {
    console.error("[upload:delete]", error);
    return NextResponse.json(
      { message: "تعذّر حذف الملف" },
      { status: 500 },
    );
  }
}
