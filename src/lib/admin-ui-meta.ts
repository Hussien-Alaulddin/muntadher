import { adminPath } from "@/lib/admin-base-path";
import type { CollectionName } from "@/lib/admin-collections";
import { collections } from "@/lib/admin-collections";
import { ADMIN_MEDIA_SIZES, mediaSizeHint } from "@/lib/admin-media-sizes";
import { emptyCourseDetail } from "@/lib/course-detail";
import { emptyCourseWatchContent } from "@/lib/course-watch";
import {
  digitalImpactPlatformOptions,
  socialLinkPlatformOptions,
} from "@/lib/social-platforms";

export type FieldType =
  | "text"
  | "textarea"
  | "url"
  | "media"
  | "number"
  | "boolean"
  | "select"
  | "meta-list"
  | "gallery-list"
  | "files-list"
  | "course-detail"
  | "course-watch";

export type FieldOption = {
  value: string;
  label: string;
  /** مفتاح أيقونة من socialIconMap إن وُجد */
  iconKey?: string;
};

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  options?: FieldOption[];
  /** لنوع media: صورة / فيديو / ملف / الاثنين */
  mediaAccept?: "image" | "video" | "both" | "file";
  /** مجلد التخزين داخل bucket أو uploads */
  mediaFolder?: string;
  /** مقاس رفع ثابت (يفرض نسبة الأبعاد عند الرفع) */
  mediaFixedSize?: { width: number; height: number; tolerance?: number };
};

export type CollectionMeta = {
  name: CollectionName;
  title: string;
  description: string;
  /** حقول تظهر في صف القائمة */
  listKeys: string[];
  fields: FieldDef[];
};

const all = collections;

function requiredOf(name: CollectionName, key: string) {
  return (all[name].required as readonly string[]).includes(key);
}

export const collectionMeta: Record<CollectionName, CollectionMeta> = {
  projects: {
    name: "projects",
    title: "المشاريع",
    description: "أعمال البورتفوليو وصفحات الـ case study",
    listKeys: ["title", "category", "published", "order"],
    fields: [
      { key: "title", label: "العنوان", type: "text", required: true },
      { key: "slug", label: "المعرّف (slug)", type: "text", required: true, hint: "يظهر في الرابط: /projects/slug — لا تغيّره بعد النشر إن أمكن" },
      { key: "category", label: "التصنيف", type: "text", required: true },
      { key: "imageUrl", label: "صورة البطاقة", type: "media", mediaAccept: "image", mediaFolder: "projects", hint: mediaSizeHint(ADMIN_MEDIA_SIZES.projectCard, "تظهر في قائمة المشاريع") },
      { key: "order", label: "الترتيب", type: "number", hint: "من 1 إلى عدد العناصر" },
      { key: "published", label: "منشور", type: "boolean" },
      { key: "description", label: "الوصف", type: "textarea" },
      {
        key: "meta",
        label: "بطاقات المعلومات",
        type: "meta-list",
        hint: "مثل: العام، العميل، نوع المشروع — أضف بطاقة لكل معلومة",
      },
      {
        key: "brandGallery",
        label: "صور المشروع",
        type: "gallery-list",
        hint: mediaSizeHint(ADMIN_MEDIA_SIZES.projectGallery, "اضغط «إضافة عنصر» لكل صورة"),
      },
    ],
  },
  courses: {
    name: "courses",
    title: "الدورات",
    description: "الدورات التدريبية وصفحة تفاصيل كل دورة",
    listKeys: ["title", "type", "price", "published", "order"],
    fields: [
      { key: "title", label: "عنوان الدورة", type: "text", required: true },
      {
        key: "slug",
        label: "المعرّف (slug)",
        type: "text",
        required: true,
        hint: "يظهر في الرابط: /products/slug",
      },
      {
        key: "type",
        label: "نوع الدورة",
        type: "text",
        required: true,
        placeholder: "دورة رقميّة مسجّلة",
      },
      { key: "description", label: "الوصف القصير (بطاقة الأرشيف)", type: "textarea" },
      {
        key: "price",
        label: "السعر",
        type: "text",
        required: true,
        placeholder: "$40 أو قريباً",
      },
      {
        key: "ctaLabel",
        label: "نص زر البطاقة",
        type: "text",
        placeholder: "تفاصيل الدورة",
      },
      {
        key: "href",
        label: "رابط التسجيل الخارجي",
        type: "url",
        hint: "رابط الدفع/التسجيل — يُستخدم لزر «سجل الآن» إن لم يُحدد داخل محتوى الصفحة",
      },
      {
        key: "imageUrl",
        label: "صورة البطاقة",
        type: "media",
        mediaAccept: "image",
        mediaFolder: "products",
        hint: mediaSizeHint(ADMIN_MEDIA_SIZES.productCard),
      },
      {
        key: "coverImageUrl",
        label: "خلفية/غلاف صفحة الدورة",
        type: "media",
        mediaAccept: "image",
        mediaFolder: "products",
        hint: mediaSizeHint(ADMIN_MEDIA_SIZES.productCover),
      },
      {
        key: "courseDetail",
        label: "محتوى صفحة تفاصيل الدورة",
        type: "course-detail",
        hint: "البطل، الإحصائيات، المحاور التسويقية، التقييمات، المدرب، والعرض السعري",
      },
      {
        key: "courseWatch",
        label: "محتوى مشاهدة الدورة (محاور ودروس)",
        type: "course-watch",
        hint: "المحاور التعليمية داخل الدورة: دروس، وصف، فيديو، وملحقات (ملفات أو روابط)",
      },
      { key: "order", label: "الترتيب", type: "number", hint: "من 1 إلى عدد العناصر" },
      { key: "published", label: "منشور", type: "boolean" },
    ],
  },
  booklets: {
    name: "booklets",
    title: "الكتيبات",
    description: "مكتبة الكتيبات الرقمية وملفات التحميل",
    listKeys: ["title", "type", "price", "published", "order"],
    fields: [
      { key: "title", label: "عنوان الكتيّب", type: "text", required: true },
      {
        key: "slug",
        label: "المعرّف (slug)",
        type: "text",
        required: true,
        hint: "يظهر في الرابط: /products/slug",
      },
      {
        key: "type",
        label: "النوع",
        type: "text",
        required: true,
        placeholder: "كتيّب إلكتروني",
      },
      { key: "description", label: "الوصف القصير (بطاقة الأرشيف)", type: "textarea" },
      {
        key: "body",
        label: "وصف صفحة الكتيّب",
        type: "textarea",
        hint: "يظهر في صفحة التفاصيل — فقرة لكل سطر",
      },
      {
        key: "price",
        label: "السعر",
        type: "text",
        required: true,
        placeholder: "مجاني أو $20",
      },
      {
        key: "ctaLabel",
        label: "نص الزر",
        type: "text",
        placeholder: "تحميل مجاني",
      },
      {
        key: "imageUrl",
        label: "صورة البطاقة",
        type: "media",
        mediaAccept: "image",
        mediaFolder: "products",
        hint: mediaSizeHint(ADMIN_MEDIA_SIZES.productCard),
      },
      {
        key: "coverImageUrl",
        label: "غلاف صفحة التفاصيل",
        type: "media",
        mediaAccept: "image",
        mediaFolder: "products",
        hint: mediaSizeHint(ADMIN_MEDIA_SIZES.productCover),
      },
      {
        key: "files",
        label: "ملفات التحميل",
        type: "files-list",
        hint: "ملفات رقمية — مقفلة حتى يسجّل العميل ويدّعي المنتج",
      },
      { key: "order", label: "الترتيب", type: "number", hint: "من 1 إلى عدد العناصر" },
      { key: "published", label: "منشور", type: "boolean" },
    ],
  },
  stats: {
    name: "stats",
    title: "الإحصائيات",
    description: "أرقام قسم الإحصائيات (التسميات غالباً ثابتة)",
    listKeys: ["label", "value", "slug", "order"],
    fields: [
      { key: "label", label: "التسمية", type: "text", required: true },
      { key: "slug", label: "المعرّف", type: "text", required: true },
      { key: "value", label: "القيمة", type: "text", placeholder: "120+" },
      { key: "order", label: "الترتيب", type: "number", hint: "من 1 إلى عدد العناصر" },
    ],
  },
  awards: {
    name: "awards",
    title: "الجوائز",
    description: "قسم الجوائز في الصفحة الرئيسية",
    listKeys: ["title", "org", "order"],
    fields: [
      { key: "title", label: "العنوان", type: "text", required: true },
      { key: "org", label: "الجهة", type: "text", required: true },
      { key: "description", label: "الوصف", type: "textarea", required: true },
      { key: "imageUrl", label: "الصورة", type: "media", mediaAccept: "image", mediaFolder: "awards", hint: mediaSizeHint(ADMIN_MEDIA_SIZES.award) },
      { key: "order", label: "الترتيب", type: "number", hint: "من 1 إلى عدد العناصر" },
    ],
  },
  "digital-impact": {
    name: "digital-impact",
    title: "التأثير الرقمي",
    description: "أرقام المنصات (متابعون، مشاهدات…)",
    listKeys: ["platform", "value", "label", "order"],
    fields: [
      {
        key: "platform",
        label: "المنصة",
        type: "select",
        required: true,
        options: digitalImpactPlatformOptions,
        hint: "اختر المنصة لعرض شعارها تلقائياً",
      },
      { key: "value", label: "القيمة", type: "text", required: true },
      { key: "label", label: "نوع العد", type: "text", required: true, placeholder: "متابع" },
      { key: "url", label: "الرابط", type: "url" },
      { key: "order", label: "الترتيب", type: "number", hint: "من 1 إلى عدد العناصر" },
    ],
  },
  tasks: {
    name: "tasks",
    title: "أعمل حالياً على",
    description: "قائمة المهام الجارية",
    listKeys: ["text", "completed", "tag", "order"],
    fields: [
      { key: "text", label: "النص", type: "textarea", required: true },
      { key: "completed", label: "مكتمل", type: "boolean" },
      { key: "tag", label: "وسم", type: "text" },
      { key: "tagHref", label: "رابط الوسم", type: "url" },
      { key: "order", label: "الترتيب", type: "number", hint: "من 1 إلى عدد العناصر" },
    ],
  },
  "career-highlights": {
    name: "career-highlights",
    title: "محطات المسيرة",
    description: "نقاط بارزة في المسيرة المهنية",
    listKeys: ["text", "order"],
    fields: [
      { key: "text", label: "النص", type: "textarea", required: true },
      { key: "order", label: "الترتيب", type: "number", hint: "من 1 إلى عدد العناصر" },
    ],
  },
  "client-logos": {
    name: "client-logos",
    title: "شعارات العملاء",
    description: "شريط شعارات العملاء",
    listKeys: ["name", "order"],
    fields: [
      { key: "name", label: "الاسم", type: "text", required: true },
      { key: "logoUrl", label: "الشعار", type: "media", mediaAccept: "image", mediaFolder: "logos", hint: mediaSizeHint(ADMIN_MEDIA_SIZES.clientLogo, "خلفية شفافة PNG إن أمكن") },
      { key: "order", label: "الترتيب", type: "number", hint: "من 1 إلى عدد العناصر" },
    ],
  },
  testimonials: {
    name: "testimonials",
    title: "الشهادات",
    description: "آراء العملاء",
    listKeys: ["name", "title", "order"],
    fields: [
      { key: "quote", label: "الاقتباس", type: "textarea", required: true },
      { key: "name", label: "الاسم", type: "text", required: true },
      { key: "title", label: "الصفة", type: "text", required: true },
      { key: "order", label: "الترتيب", type: "number", hint: "من 1 إلى عدد العناصر" },
    ],
  },
  faqs: {
    name: "faqs",
    title: "الأسئلة الشائعة",
    description: "تظهر في الرئيسية وصفحة المنهجية",
    listKeys: ["question", "order"],
    fields: [
      { key: "question", label: "السؤال", type: "text", required: true },
      { key: "answer", label: "الجواب", type: "textarea", required: true },
      { key: "order", label: "الترتيب", type: "number", hint: "من 1 إلى عدد العناصر" },
    ],
  },
  socials: {
    name: "socials",
    title: "روابط التواصل",
    description: "أيقونات الفوتر وروابط التواصل",
    listKeys: ["platform", "url", "enabled", "order"],
    fields: [
      {
        key: "platform",
        label: "المنصة",
        type: "select",
        required: true,
        options: socialLinkPlatformOptions,
        hint: "اختر المنصة لعرض شعارها في الفوتر",
      },
      { key: "url", label: "الرابط", type: "url", required: true },
      { key: "enabled", label: "مفعّل", type: "boolean" },
      { key: "order", label: "الترتيب", type: "number", hint: "من 1 إلى عدد العناصر" },
    ],
  },
};

/** يزامن required من سجل الـ API */
for (const meta of Object.values(collectionMeta)) {
  for (const field of meta.fields) {
    if (requiredOf(meta.name, field.key)) field.required = true;
  }
}

export const adminNav = [
  { href: adminPath(), label: "نظرة عامة", exact: true },
  { href: adminPath("/settings"), label: "الإعدادات" },
  { href: adminPath("/customers"), label: "بيانات العملاء" },
  { href: adminPath("/course-purchases"), label: "طلبات شراء الدورات" },
  { href: adminPath("/form-questions"), label: "أسئلة الاستمارة" },
  { href: adminPath("/form-responses"), label: "ردود الاستمارة" },
  ...Object.values(collectionMeta).map((c) => ({
    href: adminPath(`/${c.name}`),
    label: c.title,
  })),
  { href: adminPath("/reports"), label: "التقارير" },
] as const;

export function emptyItem(collection: CollectionName): Record<string, unknown> {
  const item: Record<string, unknown> = {};
  for (const field of collectionMeta[collection].fields) {
    if (field.type === "boolean")
      item[field.key] =
        field.key === "published" || field.key === "enabled";
    else if (field.type === "number")
      item[field.key] = field.key === "order" ? 1 : 0;
    else if (field.type === "select")
      item[field.key] = field.options?.[0]?.value ?? "";
    else if (
      field.type === "meta-list" ||
      field.type === "gallery-list" ||
      field.type === "files-list"
    )
      item[field.key] = [];
    else if (field.type === "course-detail") item[field.key] = emptyCourseDetail();
    else if (field.type === "course-watch")
      item[field.key] = emptyCourseWatchContent();
    else if (field.key === "ctaLabel") {
      item[field.key] =
        collection === "courses" ? "تفاصيل الدورة" : "اعرف أكثر";
    } else if (field.key === "type") {
      item[field.key] =
        collection === "courses"
          ? "دورة رقميّة مسجّلة"
          : collection === "booklets"
            ? "كتيّب إلكتروني"
            : "";
    } else item[field.key] = "";
  }
  return item;
}

/** الترتيب التالي عند الإضافة = عدد العناصر + 1 */
export { nextOrderValue, maxOrderValue, clampOrder } from "@/lib/admin-order";
