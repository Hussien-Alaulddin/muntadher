import type { SocialIconKey } from "@/components/icons";

export type SocialPlatformOption = {
  value: string;
  label: string;
  iconKey: SocialIconKey;
};

/** خيارات التأثير الرقمي — القيمة تظهر كنص المنصة في الواجهة */
export const digitalImpactPlatformOptions: SocialPlatformOption[] = [
  { value: "انستجرام", label: "انستجرام", iconKey: "instagram" },
  { value: "لينكدإن", label: "لينكدإن", iconKey: "linkedin" },
  { value: "تيليجرام", label: "تيليجرام", iconKey: "telegram" },
  { value: "بيهانس", label: "بيهانس", iconKey: "behance" },
  { value: "بينترست", label: "بينترست", iconKey: "pinterest" },
  { value: "ثريدز", label: "ثريدز", iconKey: "threads" },
  { value: "واتساب", label: "واتساب", iconKey: "whatsapp" },
  { value: "يوتيوب", label: "يوتيوب", iconKey: "youtube" },
  { value: "إكس", label: "إكس (تويتر)", iconKey: "x" },
  { value: "تيك توك", label: "تيك توك", iconKey: "tiktok" },
  { value: "فيسبوك", label: "فيسبوك", iconKey: "facebook" },
  { value: "سناب شات", label: "سناب شات", iconKey: "snapchat" },
  { value: "دريبل", label: "دريبل", iconKey: "dribbble" },
  { value: "جيت هب", label: "جيت هب", iconKey: "github" },
  { value: "ديسكورد", label: "ديسكورد", iconKey: "discord" },
  { value: "فيميو", label: "فيميو", iconKey: "vimeo" },
  { value: "ميديوم", label: "ميديوم", iconKey: "medium" },
];

/** خيارات روابط التواصل — القيمة مفتاح الأيقونة في الفوتر */
export const socialLinkPlatformOptions: SocialPlatformOption[] = [
  { value: "instagram", label: "انستجرام", iconKey: "instagram" },
  { value: "linkedin", label: "لينكدإن", iconKey: "linkedin" },
  { value: "telegram", label: "تيليجرام", iconKey: "telegram" },
  { value: "behance", label: "بيهانس", iconKey: "behance" },
  { value: "pinterest", label: "بينترست", iconKey: "pinterest" },
  { value: "threads", label: "ثريدز", iconKey: "threads" },
  { value: "whatsapp", label: "واتساب", iconKey: "whatsapp" },
  { value: "youtube", label: "يوتيوب", iconKey: "youtube" },
  { value: "x", label: "إكس (تويتر)", iconKey: "x" },
  { value: "tiktok", label: "تيك توك", iconKey: "tiktok" },
  { value: "facebook", label: "فيسبوك", iconKey: "facebook" },
  { value: "snapchat", label: "سناب شات", iconKey: "snapchat" },
  { value: "dribbble", label: "دريبل", iconKey: "dribbble" },
  { value: "github", label: "جيت هب", iconKey: "github" },
  { value: "discord", label: "ديسكورد", iconKey: "discord" },
  { value: "vimeo", label: "فيميو", iconKey: "vimeo" },
  { value: "medium", label: "ميديوم", iconKey: "medium" },
];

/** ربط أسماء المنصات (عربي/إنجليزي) بمفتاح الأيقونة */
export const platformIconKeys: Record<string, SocialIconKey> = {
  انستجرام: "instagram",
  instagram: "instagram",
  لينكدإن: "linkedin",
  linkedin: "linkedin",
  تيليجرام: "telegram",
  telegram: "telegram",
  بيهانس: "behance",
  behance: "behance",
  بينترست: "pinterest",
  pinterest: "pinterest",
  ثريدز: "threads",
  threads: "threads",
  واتساب: "whatsapp",
  whatsapp: "whatsapp",
  يوتيوب: "youtube",
  youtube: "youtube",
  إكس: "x",
  اكس: "x",
  تويتر: "x",
  x: "x",
  twitter: "x",
  "تيك توك": "tiktok",
  تيكتوك: "tiktok",
  tiktok: "tiktok",
  فيسبوك: "facebook",
  facebook: "facebook",
  "سناب شات": "snapchat",
  سنابشات: "snapchat",
  snapchat: "snapchat",
  دريبل: "dribbble",
  dribbble: "dribbble",
  "جيت هب": "github",
  جيتهب: "github",
  github: "github",
  ديسكورد: "discord",
  discord: "discord",
  فيميو: "vimeo",
  vimeo: "vimeo",
  ميديوم: "medium",
  medium: "medium",
};
