/** مقاسات الصور الموصى بها في لوحة التحكم — دقة عالية */

export type MediaSizeSpec = {
  width: number;
  height: number;
  /** نسبة اختيارية للعرض */
  ratioLabel?: string;
};

export function mediaSizeHint(
  size: MediaSizeSpec,
  extra?: string,
): string {
  const sizeText = `المقاس الموصى به: ${size.width} × ${size.height} بكسل`;
  const ratio = size.ratioLabel ? ` (نسبة ${size.ratioLabel})` : "";
  const base = `${sizeText}${ratio}`;
  return extra ? `${extra} — ${base}` : base;
}

export const ADMIN_MEDIA_SIZES = {
  avatar: { width: 1200, height: 1200, ratioLabel: "1:1" },
  hero: { width: 2400, height: 2240, ratioLabel: "400:374" },
  banner: { width: 2400, height: 1800, ratioLabel: "4:3" },
  projectCard: { width: 2530, height: 2170, ratioLabel: "253:217" },
  projectGallery: { width: 3240, height: 1350, ratioLabel: "3240:1350" },
  productCard: { width: 2260, height: 1740, ratioLabel: "226:174" },
  productCover: { width: 3200, height: 2000, ratioLabel: "16:10" },
  award: { width: 1600, height: 1600, ratioLabel: "1:1" },
  clientLogo: { width: 1600, height: 800, ratioLabel: "2:1" },
  brandMark: { width: 512, height: 512, ratioLabel: "1:1" },
  navbarLogo: { width: 640, height: 160, ratioLabel: "4:1" },
  footerLogo: { width: 1200, height: 400, ratioLabel: "3:1" },
  courseHero: { width: 3200, height: 2000, ratioLabel: "16:10" },
  courseModule: { width: 2400, height: 1500, ratioLabel: "16:10" },
  courseInteractive: { width: 3200, height: 2000, ratioLabel: "16:10" },
  instructor: { width: 1600, height: 2000, ratioLabel: "4:5" },
  courseGallery: { width: 2400, height: 1500, ratioLabel: "16:10" },
  watchPoster: { width: 3840, height: 2160, ratioLabel: "16:9" },
  lessonPoster: { width: 1920, height: 1080, ratioLabel: "16:9" },
} as const satisfies Record<string, MediaSizeSpec>;
