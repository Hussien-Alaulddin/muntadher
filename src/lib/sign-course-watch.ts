import type { CourseWatchContent } from "@/lib/course-watch";
import {
  createSignedMediaUrl,
  DEFAULT_SIGNED_URL_SECONDS,
  resolveMediaRef,
} from "@/lib/media-access";
import { createSignedLocalMediaUrl } from "@/lib/media-local-sign";

async function signUrl(
  url: string,
  productId: string,
  expiresIn: number,
): Promise<string> {
  if (!url.trim()) return url;

  const ref = resolveMediaRef(url);
  if (ref?.localPrivate || (ref?.isPrivate && ref.localPublic === false && url.startsWith("/api/media/local"))) {
    return (
      createSignedLocalMediaUrl({
        objectKey: ref.objectKey,
        productId,
        expiresInSeconds: expiresIn,
      }) || url
    );
  }

  // محلي خاص مخزّن كـ /api/media/local أو سيُحفظ كذلك
  if (ref?.isPrivate && !url.includes("supabase")) {
    const local = createSignedLocalMediaUrl({
      objectKey: ref.objectKey,
      productId,
      expiresInSeconds: expiresIn,
    });
    if (local) return local;
  }

  const signed = await createSignedMediaUrl(url, expiresIn);
  if (!signed) return url;

  if (signed.startsWith("/api/media/local?")) {
    const key =
      resolveMediaRef(url)?.objectKey ||
      new URL(signed, "http://local.invalid").searchParams.get("key") ||
      "";
    if (key) {
      return (
        createSignedLocalMediaUrl({
          objectKey: key,
          productId,
          expiresInSeconds: expiresIn,
        }) || signed
      );
    }
  }

  return signed;
}

/** يوقّع روابط الفيديو/الملحقات الخاصة قبل إرسالها للمتصفح */
export async function signCourseWatchContent(
  content: CourseWatchContent,
  productId: string,
  expiresIn = DEFAULT_SIGNED_URL_SECONDS,
): Promise<CourseWatchContent> {
  const sections = await Promise.all(
    content.sections.map(async (section) => ({
      ...section,
      lessons: await Promise.all(
        section.lessons.map(async (lesson) => ({
          ...lesson,
          videoUrl: await signUrl(lesson.videoUrl, productId, expiresIn),
          posterUrl: await signUrl(lesson.posterUrl, productId, expiresIn),
          fileUrl: await signUrl(lesson.fileUrl, productId, expiresIn),
          attachments: await Promise.all(
            lesson.attachments.map(async (item) => ({
              ...item,
              url:
                item.kind === "file"
                  ? await signUrl(item.url, productId, expiresIn)
                  : item.url,
            })),
          ),
        })),
      ),
    })),
  );

  return {
    ...content,
    player: {
      ...content.player,
      emptyPosterUrl: await signUrl(
        content.player.emptyPosterUrl,
        productId,
        expiresIn,
      ),
    },
    sections,
  };
}
