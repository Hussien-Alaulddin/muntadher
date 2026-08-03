/** أسئلة استمارة طلب المشروع الافتراضية — من project-request-form.json */

export type ProjectFormQuestionType =
  | "text"
  | "textarea"
  | "single_select"
  | "multi_select"
  | "contact_methods";

export type ProjectFormQuestionSeed = {
  key: string;
  heading: string;
  subtext?: string | null;
  type: ProjectFormQuestionType;
  required: boolean;
  options?: string[] | null;
  order: number;
};

/** أسئلة تجريبية مطابقة لاستمارة Tally المرجعية (ghonimyarts) */
export const projectFormQuestionsSeed: ProjectFormQuestionSeed[] = [
  {
    key: "name",
    heading: "الاسم",
    subtext:
      "يمكنك ملئ هذا الاستبيان، او التواصل معي مباشرةً عبر البريد.",
    type: "text",
    required: true,
    order: 1,
  },
  {
    key: "help_type",
    heading: "كيف يمكنني مساعدتك يا {الاسم}؟",
    type: "single_select",
    required: true,
    options: ["مشروع هويّة بصريّة", "استراتيجيّة براند", "صفحة هبوط"],
    order: 2,
  },
  {
    key: "role",
    heading: "ما دورك يا {الاسم} في المشروع؟",
    type: "single_select",
    required: true,
    options: [
      "صاحب المشروع مباشرة",
      "هيئة حكومية",
      "مدير تسويق",
      "وكالة أو شركة تصميم",
      "عميل لديه عميل",
      "مؤثر أو شخصية عامة",
      "منظمة غير ربحية أو جمعية",
      "أخرى",
    ],
    order: 3,
  },
  {
    key: "project_description",
    heading: "هل يمكنك مشاركة معلومات عن مشروعك؟",
    type: "textarea",
    required: true,
    order: 4,
  },
  {
    key: "project_link",
    heading:
      "هل لدى مشروعك موقع الكتروني او منصة تواصل اجتماعي يمكنني رؤيتها؟",
    type: "text",
    required: false,
    order: 5,
  },
  {
    key: "company_size",
    heading: "حجم شركتكم؟",
    type: "single_select",
    required: true,
    options: [
      "من شخص واحد",
      "صغيرة الحجم: 1-3 أفراد",
      "متوسطة: 10-25 فرد",
      "أكبر: 25 وأكثر",
    ],
    order: 6,
  },
  {
    key: "budget",
    heading: "ما قيمة استثمارك في هذا العمل؟",
    type: "single_select",
    required: true,
    options: ["800-1000 دولار", "1000-2500 دولار", "2500-5000 دولار"],
    order: 7,
  },
  {
    key: "contact",
    heading: "كيف يمكننا التواصل؟ (أختر ما يناسبك)",
    type: "contact_methods",
    required: true,
    options: ["ايميل", "واتس آب", "انستجرام"],
    order: 8,
  },
];

export function toPublicFormQuestions(
  rows: Array<{
    id?: string;
    key: string;
    heading: string;
    subtext?: string | null;
    type: ProjectFormQuestionType | string;
    required: boolean;
    options?: string[] | null;
    order: number;
  }>,
) {
  return rows.map((q, index) => ({
    id: q.id ?? q.key,
    key: q.key,
    heading: q.heading,
    subtext: q.subtext ?? null,
    type: q.type as ProjectFormQuestionType,
    required: q.required,
    options: q.options ?? null,
    order: q.order || index + 1,
  }));
}

export function personalizeHeading(heading: string, name: string) {
  const safe = name.trim() || "صديقي";
  return heading.replaceAll("{الاسم}", safe);
}

/** رابط زر طلب المشروع — الاستمارة الداخلية فقط */
export function projectRequestHref() {
  return "/project-request";
}
