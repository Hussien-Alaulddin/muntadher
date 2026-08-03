/**
 * محتوى تجريبي (demo) يُعرض افتراضياً عشان يشوف المصمم الموقع كامل من أول تشغيل،
 * ويقدر يستبدله عنصراً عنصراً من لوحة التحكم.
 *
 * يغطي الأقسام اللي ما أعطاها page-home.json محتوى ابتدائي: بانر "جديد"،
 * الأسئلة الشائعة، شعارات العملاء. أما الجوائز والتأثير الرقمي والشهادات
 * فمحتواها منقول من placeholderContent في page-home.json نفسه.
 *
 * كل النصوص موسومة صريحاً بأنها تجريبية. لإخفائها كلها قبل الإطلاق للعامة:
 * DEMO_CONTENT=off في متغيّرات البيئة، أو احذف العناصر من لوحة التحكم.
 */

import { trustPlaceholders } from "@/lib/placeholder-content";

/** المحتوى التجريبي مفعّل افتراضياً، ويُطفأ بـ DEMO_CONTENT=off */
export const isDemoContentEnabled = process.env.DEMO_CONTENT !== "off";

export const demoBanner = {
  enabled: true,
  badgeLabel: "جديد",
  title: "توثيق المشاريع وبناء عرض احترافي",
  contentType: "ويبينار (لقاء أونلاين)",
  ctaLabel: "رابط المحاضرة المسجّلة",
  href: "/products",
  imageUrl: null as string | null,
};

export const demoAwards = trustPlaceholders.awards;

export const demoDigitalImpact = [
  { platform: "انستجرام", value: "9K", label: "متابع" },
  { platform: "لينكدإن", value: "8K", label: "مستفيد" },
  { platform: "تيليجرام", value: "21K", label: "مشترك" },
  { platform: "بيهانس", value: "84K", label: "مشاهدة" },
];

export const demoTestimonials = trustPlaceholders.testimonials;

export const demoClientLogos = [
  { name: "عميل تجريبي 1" },
  { name: "عميل تجريبي 2" },
  { name: "عميل تجريبي 3" },
  { name: "عميل تجريبي 4" },
  { name: "عميل تجريبي 5" },
];

export const demoFaqs = [
  {
    question: "سؤال تجريبي 1: كم تستغرق مدة تنفيذ الهوية البصرية؟",
    answer:
      "نص إجابة تجريبي مؤقت يوضح شكل وطول الإجابة داخل الأكورديون — يكتب المصمم إجابته الفعلية من لوحة التحكم.",
  },
  {
    question: "سؤال تجريبي 2: هل تقدّم تصميم الشعار بشكل منفصل؟",
    answer: "نص إجابة تجريبي قصير لاختبار تجاوب الأكورديون مع إجابة أقصر.",
  },
  {
    question: "سؤال تجريبي 3: ما الذي تشمله الهوية البصرية الكاملة؟",
    answer:
      "نص إجابة تجريبي أطول قليلاً، الغرض منه معاينة كيف يتصرف الأكورديون مع فقرة تمتد لأكثر من سطر داخل الشاشات الصغيرة والكبيرة.",
  },
  {
    question: "سؤال تجريبي 4: كيف تبدأ خطوات العمل على المشروع؟",
    answer: "نص إجابة تجريبي مؤقت — يُستبدل بإجابة المصمم الفعلية.",
  },
];
