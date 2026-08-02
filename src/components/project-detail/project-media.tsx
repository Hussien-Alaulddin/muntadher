import Image from "next/image";
import type { ProjectGalleryItem } from "@/lib/content";
import { PROJECT_CASE_IMAGE } from "@/lib/project-case-image";
import { isVideoUrl } from "@/lib/media-kinds";
import { MediaPlaceholder } from "@/components/ui";

type StackFrame = {
  key: string;
  url: string | null;
  alt: string;
  /** الشعار يُعرض محتوياً داخل الإطار؛ بقية الصور تغطي الإطار */
  fit: "cover" | "contain";
  video?: boolean;
};

function CaseFrame({ frame }: { frame: StackFrame }) {
  const video = Boolean(frame.video || (frame.url && isVideoUrl(frame.url)));

  return (
    <div
      className="relative w-full overflow-hidden bg-surface-alt"
      style={{ aspectRatio: PROJECT_CASE_IMAGE.aspectRatio }}
    >
      {frame.url ? (
        video ? (
          <video
            src={frame.url}
            className="absolute inset-0 size-full object-cover"
            controls
            playsInline
            preload="metadata"
            aria-label={frame.alt}
          />
        ) : (
          <Image
            src={frame.url}
            alt={frame.alt}
            fill
            sizes="100vw"
            className={frame.fit === "contain" ? "object-contain" : "object-cover"}
            priority={frame.key === "cover" || frame.key === "logo"}
          />
        )
      ) : (
        <MediaPlaceholder label={frame.alt} />
      )}
    </div>
  );
}

/**
 * شريط صور المشروع بأسلوب بيهانس:
 * إطار ثابت 3240×1350، صور فوق بعضها بدون فراغات أو زوايا.
 */
export function ProjectCaseStudyStack({
  title,
  logoImageUrl,
  coverImageUrl,
  brandGallery,
  applicationGallery,
}: {
  title: string;
  logoImageUrl: string | null;
  coverImageUrl: string | null;
  brandGallery: ProjectGalleryItem[];
  applicationGallery: ProjectGalleryItem[];
}) {
  const frames: StackFrame[] = [];

  if (logoImageUrl) {
    frames.push({
      key: "logo",
      url: logoImageUrl,
      alt: `شعار ${title}`,
      fit: "contain",
    });
  }

  if (coverImageUrl) {
    frames.push({
      key: "cover",
      url: coverImageUrl,
      alt: `غلاف ${title}`,
      fit: "cover",
      video: isVideoUrl(coverImageUrl),
    });
  }

  brandGallery.forEach((item, index) => {
    if (!item.imageUrl) return;
    frames.push({
      key: `brand-${index}`,
      url: item.imageUrl,
      alt: item.caption?.trim() || `عنصر هوية ${title} ${index + 1}`,
      fit: "cover",
    });
  });

  applicationGallery.forEach((item, index) => {
    if (!item.imageUrl) return;
    frames.push({
      key: `app-${index}`,
      url: item.imageUrl,
      alt: item.caption?.trim() || `تطبيق هوية ${title} ${index + 1}`,
      fit: "cover",
    });
  });

  if (frames.length === 0) return null;

  return (
    <section id="project-case-study" className="w-full">
      <div className="container-site">
        <div className="flex w-full flex-col overflow-hidden">
          {frames.map((frame) => (
            <CaseFrame key={frame.key} frame={frame} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** @deprecated استُبدل بـ ProjectCaseStudyStack — يُبقى للتوافق إن وُجدت استيرادات */
export function FreeformGallery({
  id,
  items,
  titlePrefix,
}: {
  id: string;
  items: ProjectGalleryItem[];
  titlePrefix: string;
}) {
  if (items.length === 0) return null;
  return (
    <section id={id} className="w-full">
      <div className="flex w-full flex-col">
        {items.map((item, index) =>
          item.imageUrl ? (
            <CaseFrame
              key={`${id}-${index}`}
              frame={{
                key: `${id}-${index}`,
                url: item.imageUrl,
                alt: item.caption?.trim() || `${titlePrefix} ${index + 1}`,
                fit: "cover",
              }}
            />
          ) : null,
        )}
      </div>
    </section>
  );
}

export function LogoShowcase({
  imageUrl,
  title,
}: {
  imageUrl: string | null;
  title: string;
}) {
  if (!imageUrl) return null;
  return (
    <CaseFrame
      frame={{
        key: "logo",
        url: imageUrl,
        alt: `شعار ${title}`,
        fit: "contain",
      }}
    />
  );
}

export function CoverImage({
  imageUrl,
  title,
}: {
  imageUrl: string | null;
  title: string;
}) {
  if (!imageUrl) return null;
  return (
    <CaseFrame
      frame={{
        key: "cover",
        url: imageUrl,
        alt: `غلاف ${title}`,
        fit: "cover",
        video: isVideoUrl(imageUrl),
      }}
    />
  );
}
