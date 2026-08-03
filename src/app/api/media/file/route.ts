import { NextResponse } from "next/server";
import {
  isPrivateObjectKey,
  localPublicFileExists,
  nodeStreamToWeb,
  openLocalPublicReadStream,
} from "@/lib/media-access";

export const runtime = "nodejs";

/**
 * خدمة الملفات العامة من MEDIA_ROOT/public (أو public/uploads محلياً).
 * للصور التسويقية التي لا تُخدم من مجلد نشر GitHub.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key")?.trim() ?? "";

  if (!key || key.includes("..") || key.startsWith("/")) {
    return NextResponse.json({ message: "طلب غير صالح" }, { status: 400 });
  }

  if (isPrivateObjectKey(key)) {
    return NextResponse.json(
      { message: "تعذّر الوصول إلى الملف" },
      { status: 400 },
    );
  }

  if (!localPublicFileExists(key)) {
    return NextResponse.json({ message: "الملف غير موجود" }, { status: 404 });
  }

  const stream = openLocalPublicReadStream(key);
  if (!stream) {
    return NextResponse.json({ message: "الملف غير موجود" }, { status: 404 });
  }

  const filename = key.split("/").pop() || "file";
  return new NextResponse(nodeStreamToWeb(stream), {
    headers: {
      "Content-Type": guessContentType(filename),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
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
    case "avif":
      return "image/avif";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}
