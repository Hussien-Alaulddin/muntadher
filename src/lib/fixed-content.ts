/**
 * كل النصوص الموصوفة بـ "source": "fixed" في page-home.json.
 * منقولة حرفياً كما هي، وما تُدار من لوحة التحكم.
 */

export const navbar = {
  links: [
    { label: "الرئيسية", href: "/" },
    { label: "أعمالي", href: "/projects" },
    { label: "منهجية العمل", href: "/handbook" },
    { label: "المنتجات", href: "/products" },
  ],
  cta: { label: "لديك علامة تجارية؟" },
} as const;

export const hero = {
  badge: "مُصمّم هُويّات بصريّة",
  heading: "شريكك الاستراتيجيّ لهُويّة علامتك التجاريّة",
  paragraph:
    "اعمل على تحويل العلامة الى قصة، والقصة الى هُويّة بصريّة، من خلال منهجية تعتمد على بناء استراتيجي للعلامة",
  ctaPrimary: "استمارة طلب مشروع",
  ctaSecondary: "تواصل معي",
  floatingBadge: "متاح لمشاريع مُختارة",
} as const;

/** نصوص ثابتة من page-projects.json */
export const projectsPage = {
  badge: "مشاريع أفخر بها",
  heading: "نصنع هويات .. تُحكى قصصها",
  subtext: "اعمالي في تصميم الهويات البصريّة",
  ctaLabel: "استمارة طلب مشروع",
  emptyTitle: "لا توجد أعمال معروضة حالياً",
  emptyBody: "سيتم عرض المشاريع هنا قريباً.",
} as const;

/** نصوص ثابتة من page-project-detail.json */
export const projectDetailPage = {
  externalCtaLabel: "مشاهدة المشروع كامل",
  externalCtaFallbackPlatform: "بيهانس",
} as const;

/** نصوص ثابتة من page-products-full.json — أرشيف المنتجات الكامل */
export const productsPage = {
  badge: "الدورات والمنتجات",
  heading: "دورات وملفات تدعم مسارك",
  /** أجزاء الفقرة — اسمَا البرنامجين بخط عريض كما في المرجع */
  paragraph: {
    before: "أقدّم نظامًا تعليميًا متكاملًا للمصممين يتمحور حول منتجين رئيسيين: دورة ",
    bold1: "تصميم وبناء الهويات البصرية",
    mid: " التي تؤسس فهمك العملي لمنهجية تصميم الهوية من الصفر، و",
    bold2: "معسكر المصمم الاستراتيجي",
    after:
      " الموجّه للمستوى المتقدم لتحويل الاستراتيجيات إلى أنظمة بصرية احترافية. بقية المنتجات والموارد التي أوفّرها تأتي كأدوات داعمة لهذين البرنامجين لمساعدتك على التطور وبناء هويات ذات معنى وتأثير.",
  },
  coursesTitle: "الدورات التدريبية",
  coursesEmpty: "قريباً سيتم إصدار دوراتنا التدريبية",
  bookletsTitle: "مكتبة الكتيبات",
  bookletsEmpty: "قريباً سيتم رفع كتيبات التصميم هنا",
} as const;

/** نصوص ثابتة من page-handbook.json */
export const handbookPage = {
  badge: "Handbook",
  heading: "كيف سنعمل سويا؟",
  paragraph:
    "قد لا يكون البعض قد تعامل سابقًا مع مختص في الهُويّات البصريّة، وربما اعتاد العمل مع جهات تنفّذ ما يُطلب فقط. أمّا التجربة معي فقد تختلف؛ لذلك أبدأ معكم بشفافية لأوضح فلسفتي في العمل وطريقتي الخاصة في تقديم الخدمات.",
  pillars: [
    {
      number: "01",
      title: "التعاون الإبداعي",
      description:
        "انا لست \"مُنفِذ\" لطلباتك، انا مستشارك وشريكك الاستراتيجي وتأكد ان ايّ قرار تصميمي نأخذه سوياً سيكون من اجل مصلحة مشروعك.",
    },
    {
      number: "02",
      title: "الاستراتيجيّة هي المرجع لنا",
      description:
        "سواء كانت لديك استراتيجية جاهزة، ام عملنا عليها سوياً، فستكون هذه هي مرجعنا لأيّ قرار تصميمي سيتم اتخاذه خلال عملنا على المشروع.",
    },
    {
      number: "03",
      title: "المراجعات والتعديلات",
      description:
        "لضمان توافق التصميم مع استراتيجية مشروعك، سنعتمد نقاط مراجعة محددة خلال المشروع للوصول لنتيجة تلبي تطلعاتك.",
    },
  ],
  processHeading: "آلية العمل خلال المشروع",
  processParagraph:
    "يعمل هذا الإطار الديناميكي على تعزيز الإبداع والدقّة، مما يضمن أن رحلة العمل على هويّتك البصريّة تتوافق بسلاسة مع اهداف مشروعك ورغبات جمهورك المستهدف.",
  steps: [
    {
      number: "01",
      title: "تحديد الأهداف",
      icon: "search" as const,
      description:
        "محادثتنا الأولى تشمل فهم متطلبات المشروع وتحديد أهدافه، ثم اختيار المنهجية الأنسب وإرسال عرض السعر والمخرجات النهائية.",
    },
    {
      number: "02",
      title: "الإستراتيجية",
      icon: "map" as const,
      description:
        "في حالة عدم وجود استراتيجية، سنعمل معاً على بناءها وتشمل: قصة وشخصية العلامة، الفئة المستهدفة والرسالة، الاسم المميز وTagline.",
    },
    {
      number: "03",
      title: "التوجه الفني للهويّة",
      icon: "eye" as const,
      description:
        "في هذه المرحلة نحدّد التوجّه الفني للهوية البصرية، بما يشمل نوع الشعار، لوحة الألوان، الخطوط، وأسلوب العناصر والأشكال.",
    },
    {
      number: "04",
      title: "العمل على الشعار والخط",
      icon: "brush" as const,
      description:
        "نحوّل التوجه الفني إلى عناصر الهوية الأساسية، مثل الشعار والخطوط والعناصر المميزة كالنمط والأيقونات.",
    },
    {
      number: "05",
      title: "تصميم نقاط الإتصال",
      icon: "frame" as const,
      description:
        "تطوير مواد إعلانية تشمل الأوراق المكتبية، المواد الاستهلاكية، الباكدجات، وقوالب السوشيال ميديا، وغيرها حسب طبيعة المشروع.",
    },
    {
      number: "06",
      title: "التسليم ومابعد المشروع",
      icon: "flag" as const,
      description:
        "تزويدك بجميع أصول العلامة وملف دليل الهوية، مع مناقشة أي قلق نهائي ومتابعة ما بعد المشروع لضمان الاستخدام الصحيح للهوية.",
    },
  ],
} as const;

/** التسميات الأربع ثابتة وتظهر دائماً — الأرقام فقط ديناميكية */
export const statLabels = [
  { slug: "years-experience", label: "سنوات الخبرة" },
  { slug: "completed-projects", label: "مشروعات مكتملة" },
  { slug: "industries", label: "مجالات صممت لها" },
  { slug: "countries", label: "دول صممت لها" },
] as const;

export const sections = {
  latestWork: {
    title: "أحدث أعمالي",
    link: { label: "تصفح جميع الأعمال", href: "/projects" },
    emptyTitle: "لا توجد أعمال معروضة حالياً",
    emptyBody: "سيتم عرض أحدث المشاريع هنا قريباً.",
  },
  products: {
    title: "الدورات والمنتجات",
    link: { label: "تصفح جميع المنتجات", href: "/products" },
  },
  featuredBanner: {
    tag: "جديد",
  },
  awards: {
    title: "جوائز وانجازات",
  },
  digitalImpact: {
    title: "تأثيري الرقمي",
  },
  currentlyWorking: {
    title: "اعمل حالياً على",
  },
  careerHighlights: {
    title: "أبرز محطات مسيرتي",
  },
  testimonials: {
    title: "كلمات من عملائي",
    link: { label: "تصفح جميع التقييمات", href: "/testominals" },
  },
  faq: {
    title: "اسئلة قد تراودك",
  },
  newsletter: {
    heading: "سجّل بريدك",
    subtext: "قيمة جديدة كل أسبوع",
    inputPlaceholder: "البريد الإلكتروني",
    ctaLabel: "اشترك",
  },
} as const;

/** footer.copyright — قالب ثابت تُعبّأ فيه القيم الديناميكية */
export function copyrightLine(designerName: string, siteName: string) {
  return `جميع الحقوق محفوظة لـ ${designerName} — ${siteName} © ${new Date().getFullYear()}`;
}

export const dashboardPath = "/dashboard";
