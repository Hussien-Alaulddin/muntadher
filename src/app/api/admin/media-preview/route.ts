import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import {
  createSignedMediaUrl,
  isPrivateObjectKey,
  resolveMediaRef,
  DEFAULT_SIGNED_URL_SECONDS,
} from "@/lib/media-access";

/** رابط معاينة موقّت للأدمن للملفات الخاصة المحفوظة سابقاً */
export async function GET(request: Request) {
  const unauthorized = await checkAdmin(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url).searchParams.get("url")?.trim() ?? "";
  if (!url) {
    return NextResponse.json({ message: "الرابط مطلوب" }, { status: 400 });
  }

  const ref = resolveMediaRef(url);
  if (!ref || !isPrivateObjectKey(ref.objectKey)) {
    return NextResponse.json({ previewUrl: url });
  }

  const previewUrl = await createSignedMediaUrl(url, DEFAULT_SIGNED_URL_SECONDS);
  if (!previewUrl) {
    return NextResponse.json(
      { message: "تعذّر إنشاء معاينة" },
      { status: 500 },
    );
  }

  return NextResponse.json({ previewUrl });
}
