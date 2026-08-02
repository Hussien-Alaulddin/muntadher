/**
 * محتوى تجريبي لصفحة تفاصيل الكتيّب — يطابق بنية المرجع
 * (وصف غني، ملفات، تقييمات، منتجات مشابهة) حتى يرى المصمم الصفحة كاملة.
 */

export type DemoBookletReview = {
  name: string;
  rating: number;
  comment: string | null;
  dateLabel: string;
};

export type DemoBookletDetail = {
  bodyIntro: string;
  features: { title: string; text: string }[];
  audienceTitle: string;
  audience: string[];
  note: string;
  files: { name: string; url: string }[];
  downloadsCount: number;
  averageRating: number;
  reviewsCount: number;
  reviews: DemoBookletReview[];
};

/** محتوى افتراضي يُستخدم لأي كتيّب ناقص الحقول */
export const defaultDemoBookletDetail: DemoBookletDetail = {
  bodyIntro:
    "كثير من المصممين قد يواجهون تحديات أو أخطاء أثناء بناء الهوية البصرية، مما يؤدي إلى قرارات لونية غير متماسكة. في هذا الكتيّب، نستعرض منهجية عملية لاختيار الألوان وبناء لوحة متوازنة تدعم شخصية العلامة.",
  features: [
    {
      title: "محتوى منظم وواضح",
      text: "مقسّم إلى فصول تغطي أساسيات اختيار الألوان وعلاقتها بالهوية.",
    },
    {
      title: "نصائح عملية",
      text: "إرشادات مباشرة لتجنب الأخطاء الشائعة في التباين والتناسق.",
    },
    {
      title: "أمثلة تطبيقية",
      text: "نماذج ولوحات ألوان تسهّل فهم التطبيق على مشاريع حقيقية.",
    },
    {
      title: "مناسب لجميع المستويات",
      text: "سواء كنت مبتدئًا أو محترفًا، ستجد معلومات قيّمة قابلة للتطبيق فورًا.",
    },
    {
      title: "قائمة مراجعة سريعة",
      text: "خطوة أخيرة تضمن اكتمال لوحة الألوان قبل التسليم للعميل.",
    },
  ],
  audienceTitle: "لمن هذا الكتيّب:",
  audience: [
    "المصممون",
    "الطلاب والمهتمون بمجال الهوية البصرية.",
    "أصحاب المشاريع الصغيرة الذين يبنون علامتهم بأنفسهم.",
  ],
  note: "تنويه: هذا الدليل موجّه للمصممين كمادة عملية مختصرة، وليس مقررًا أكاديميًا شاملًا لنظرية الألوان. الهدف مساعدة المصمم على اتخاذ قرارات أسرع وأكثر اتساقًا عند بناء الهوية.",
  files: [
    { name: "دليل-اختيار-الألوان.pdf", url: "/demo/colors-guide.pdf" },
    { name: "color-checklist.pdf", url: "/demo/color-checklist.pdf" },
  ],
  downloadsCount: 1284,
  averageRating: 5,
  reviewsCount: 24,
  reviews: [
    {
      name: "سامر محرز",
      rating: 5,
      comment:
        "مرجع مختصر وواضح. ساعدني أرتّب لوحة الألوان لمشروع هوية بدون تخبط، والأمثلة العملية كانت مفيدة جدًا.",
      dateLabel: "منذ شهرين",
    },
    {
      name: "طه جسّار",
      rating: 5,
      comment: "شكرًا على المجهود الطيب — أسلوب مبسّط ومرتب.",
      dateLabel: "منذ 3 أشهر",
    },
    {
      name: "عبده صلاح",
      rating: 5,
      comment: null,
      dateLabel: "منذ 4 أشهر",
    },
    {
      name: "أيمن بن عسلة",
      rating: 5,
      comment: "جزاك الله خيرًا على المجهود، استفدت من قائمة المراجعة كثيرًا.",
      dateLabel: "منذ 5 أشهر",
    },
  ],
};

/** كتيبات إضافية للقسم «منتجات أخرى قد تعجبك» وللأرشيف */
export const demoBookletsExtra = [
  {
    slug: "print-files-guide",
    type: "كتيّب إلكتروني",
    title: "دليل إعداد الملفات للطباعة",
    description:
      "مرجع رقمي موجه للمصممين لضمان إعداد ملفات تصميم جاهزة للطباعة، يتناول الألوان والمقاسات وعلامات الطباعة وتصدير الملفات.",
    body: null as string | null,
    price: "مجاني",
    ctaLabel: "تحميل الكتيّب",
    group: "resource" as const,
    downloadsCount: 1901,
    files: [
      { name: "إعداد-الملفات-للطباعة.pdf", url: "/demo/print-guide.pdf" },
      { name: "printing-checklist.pdf", url: "/demo/printing-checklist.pdf" },
    ],
  },
  {
    slug: "brand-style-sheet",
    type: "قالب",
    title: "ملف الـ Brand Style Sheet",
    description:
      "الهدف منه الوصول السريع لعناصر الهوية مثل أكواد الألوان والخط والأيقونات وأشكال الشعار.",
    body: null as string | null,
    price: "مجاني",
    ctaLabel: "تحميل الملف",
    group: "resource" as const,
    downloadsCount: 860,
    files: [
      { name: "brand-style-sheet.pdf", url: "/demo/brand-style-sheet.pdf" },
    ],
  },
  {
    slug: "design-decisions-free",
    type: "كتاب إلكتروني",
    title: "نسخة مجانية من كتاب اتخاذ القرارات التصميمية",
    description:
      "تحتوي النسخة المجانية على ثلاثة دروس للاطلاع من أصل المحتوى الكامل.",
    body: null as string | null,
    price: "مجاني",
    ctaLabel: "تحميل النسخة",
    group: "resource" as const,
    downloadsCount: 2104,
    files: [
      { name: "design-decisions-sample.pdf", url: "/demo/design-decisions-sample.pdf" },
    ],
  },
];
