/**
 * محتوى placeholder المنقول حرفياً من page-home.json.
 * يُستخدم في مكانين فقط:
 *   1. prisma/seed.ts — كبيانات ابتدائية بقاعدة البيانات.
 *   2. طبقة القراءة في lib/content.ts — كعرض مبدئي قبل ربط قاعدة البيانات.
 * وما يُكتب أبداً كنص ثابت داخل مكونات الصفحة.
 */

export const statsPlaceholder = [
  { slug: "years-experience", label: "سنوات الخبرة", value: "3+" },
  { slug: "completed-projects", label: "مشروعات مكتملة", value: "12+" },
  { slug: "industries", label: "مجالات صممت لها", value: "6+" },
  { slug: "countries", label: "دول صممت لها", value: "2+" },
];

export const projectsPlaceholder = [
  {
    slug: "rayhan-cafe",
    title: "مقهى ريحان",
    category: "مطاعم",
    description:
      "نص وصف تجريبي يشرح فكرة المشروع والتحدي والحل — هذا مثال لطول وشكل الفقرة، يُستبدل بوصف مشروع منتظر الفعلي.",
    meta: [
      { label: "حجم الشركة", value: "1-10" },
      { label: "العام", value: "2026" },
      { label: "المجال", value: "مطاعم" },
      { label: "الدولة", value: "العراق" },
    ],
    externalCaseStudyUrl: "https://www.behance.net/",
    externalCaseStudyLabel: "بيهانس",
  },
  {
    slug: "noor-app",
    title: "نور | تطبيق تأمل",
    category: "Wellness",
    description:
      "نص وصف تجريبي لمشروع نور — يوضح شكل فقرة الوصف في صفحة تفاصيل المشروع، ويُستبدل لاحقاً بالوصف الفعلي.",
    meta: [
      { label: "حجم الشركة", value: "10-20" },
      { label: "العام", value: "2025" },
      { label: "المجال", value: "Wellness" },
      { label: "الدولة", value: "الخليج" },
    ],
    externalCaseStudyUrl: "https://www.behance.net/",
    externalCaseStudyLabel: "بيهانس",
  },
  {
    slug: "khatwa-studio",
    title: "استوديو خطوة",
    category: "وكالة إبداعية",
    description:
      "نص وصف تجريبي لاستوديو خطوة — فقرة توضيحية مؤقتة لشكل ومحتوى صفحة تفاصيل المشروع.",
    meta: [
      { label: "حجم الشركة", value: "1-10" },
      { label: "العام", value: "2024" },
      { label: "المجال", value: "وكالة إبداعية" },
      { label: "الدولة", value: "العراق" },
    ],
  },
  {
    slug: "athar-personal",
    title: "أثر | هوية شخصية",
    category: "هوية شخصية",
    description:
      "نص وصف تجريبي لهوية أثر الشخصية — يُستبدل بقصة المشروع الفعلية عند إضافة المحتوى.",
    meta: [
      { label: "العام", value: "2025" },
      { label: "المجال", value: "هوية شخصية" },
      { label: "الدولة", value: "العراق" },
    ],
  },
  {
    slug: "oasis-resort",
    title: "منتجع الواحة",
    category: "فنادق",
    description:
      "نص وصف تجريبي لمنتجع الواحة — يوضح طول الفقرة المتوقع في صفحة التفاصيل.",
    meta: [
      { label: "حجم الشركة", value: "50-100" },
      { label: "العام", value: "2023" },
      { label: "المجال", value: "فنادق" },
      { label: "الدولة", value: "الإمارات" },
    ],
  },
  {
    slug: "warraq-brand",
    title: "علامة ورّاق",
    category: "أزياء وموضة",
    description:
      "نص وصف تجريبي لعلامة ورّاق — محتوى مؤقت لمعاينة شكل صفحة تفاصيل المشروع.",
    meta: [
      { label: "حجم الشركة", value: "10-20" },
      { label: "العام", value: "2024" },
      { label: "المجال", value: "أزياء وموضة" },
      { label: "الدولة", value: "السعودية" },
    ],
  },
];

/** عناصر معرض placeholder — صور رمادية بأعداد وأحجام متنوعة كما في المواصفة */
export const projectGalleryPlaceholder = {
  brand: [
    { imageUrl: null, layout: "full" as const, aspect: "3/2" },
    { imageUrl: null, layout: "half" as const, aspect: "16/10" },
    { imageUrl: null, layout: "half" as const, aspect: "16/10" },
    { imageUrl: null, layout: "full" as const, aspect: "16/9" },
  ],
  application: [
    { imageUrl: null, layout: "full" as const, aspect: "3/2" },
    { imageUrl: null, layout: "full" as const, aspect: "16/9" },
    { imageUrl: null, layout: "half" as const, aspect: "4/3" },
    { imageUrl: null, layout: "half" as const, aspect: "4/3" },
  ],
};

export const productsPlaceholder = [
  {
    slug: "visual-identity-basics",
    type: "دورة رقميّة مسجّلة",
    title: "أساسيات الهوية البصرية",
    description:
      "دورة تفاعلية تهدف الى تأهيلك للحياة العملية في مجال تصميم الهويّات البصريّة كعامِل حُر",
    price: "50000 د.ع",
    ctaLabel: "تفاصيل الدورة",
    group: "core",
  },
  {
    slug: "identity-bootcamp",
    type: "معسكر تدريبي",
    title: "معسكر بناء الهوية من الصفر",
    description:
      "معسكر تدريبي مكثف يعلّمك خطوة بخطوة كيفية تحويل استراتيجية العلامة إلى هوية بصرية",
    price: "قريباً",
    ctaLabel: "سجل في قائمة الانتظار",
    group: "core",
  },
  {
    slug: "colors-guide",
    type: "كتيّب إلكتروني",
    title: "دليل اختيار الألوان",
    description: "مرجع رقمي موجه للمصممين لضمان اختيار ألوان متماسكة في الهوية",
    body:
      "كثير من المصممين يحتاجون مرجعاً سريعاً لاختيار ألوان متماسكة في الهوية البصرية.\n\nمحتوى منظم وواضح يغطي أساسيات اختيار الألوان.\nنصائح عملية لتجنب الأخطاء الشائعة.\nأمثلة تطبيقية تسهّل بناء لوحة ألوان متوازنة.\n\nلمن هذا الكتيّب:\nالمصممون\nالطلاب والمهتمون بمجال الهوية البصرية.\n\nتنويه: هذا الدليل موجّه للمصممين كمادة عملية مختصرة.",
    price: "مجاني",
    ctaLabel: "تحميل مجاني",
    group: "resource",
  },
];

export const currentTasksPlaceholder = [
  { text: "بناء وإعداد أول دورة تدريبية", completed: false },
  { text: "تجهيز صفحة الأعمال الأولى", completed: true },
  { text: "تطوير هوية بصرية شخصية جديدة", completed: false },
];

export const careerHighlightsPlaceholder = [
  { text: "بدأ رحلته في تصميم الهويات البصرية" },
  { text: "عمل على مشاريع متنوعة في تصميم العلامات التجارية" },
];

/**
 * أقسام إثبات الثقة (جوائز، تأثير رقمي، شهادات).
 * تعليمات page-home.json: احترم emptyState فيها ولا تعرض محتوى وهمياً،
 * فهي مستثناة من البيانات الابتدائية افتراضياً وتُزرع فقط عند طلبها صريحاً
 * بـ SEED_TRUST_PLACEHOLDERS=1 (للمعاينة التصميمية أثناء التطوير).
 */
export const trustPlaceholders = {
  awards: [
    {
      org: "جهة تجريبية",
      title: "جائزة تجريبية 1",
      description: "نص وصف تجريبي مؤقت لجائزة — يُستبدل لاحقاً",
    },
    {
      org: "جهة تجريبية",
      title: "جائزة تجريبية 2",
      description: "نص وصف تجريبي مؤقت لجائزة — يُستبدل لاحقاً",
    },
  ],
  digitalImpact: [
    { platform: "انستجرام", value: "0", label: "متابع" },
    { platform: "لينكدإن", value: "0", label: "مستفيد" },
  ],
  testimonials: [
    {
      quote:
        "هذا نص شهادة تجريبي مؤقت يوضح شكل وطول الاقتباس بالبطاقة — يُستبدل بشهادة عميل حقيقي.",
      name: "اسم تجريبي",
      title: "مسمى وظيفي تجريبي",
    },
    {
      quote:
        "هذا نص شهادة تجريبي آخر بطول مختلف لاختبار تجاوب البطاقة مع نصوص أطول أو أقصر.",
      name: "اسم تجريبي 2",
      title: "مسمى وظيفي تجريبي",
    },
  ],
};
