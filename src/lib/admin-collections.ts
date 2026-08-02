import type { PrismaClient } from "@prisma/client";

/**
 * سجل المجموعات اللي تديرها لوحة التحكم.
 * كل مجموعة تحدد جدولها في Prisma والحقول المسموح كتابتها،
 * عشان الـ API يبقى واحد وما يحتاج route لكل جدول.
 */
type CollectionConfig = {
  model: keyof PrismaClient & string;
  fields: readonly string[];
  /** حقول مطلوبة عند الإنشاء */
  required: readonly string[];
  /** فلتر القائمة (مثل فصل الدورات عن الكتيبات) */
  listWhere?: Record<string, unknown>;
  /** قيم تُفرض دائماً عند الإنشاء/التحديث */
  fixedFields?: Record<string, unknown>;
};

const courseFields = [
  "slug",
  "type",
  "title",
  "description",
  "price",
  "ctaLabel",
  "href",
  "imageUrl",
  "coverImageUrl",
  "courseDetail",
  "courseWatch",
  "order",
  "published",
] as const;

const bookletFields = [
  "slug",
  "type",
  "title",
  "description",
  "body",
  "price",
  "ctaLabel",
  "imageUrl",
  "coverImageUrl",
  "files",
  "order",
  "published",
] as const;

export const collections = {
  projects: {
    model: "project",
    fields: [
      "slug",
      "title",
      "category",
      "imageUrl",
      "href",
      "order",
      "published",
      "description",
      "meta",
      "logoImageUrl",
      "coverImageUrl",
      "brandGallery",
      "applicationGallery",
      "externalCaseStudyUrl",
      "externalCaseStudyLabel",
    ],
    required: ["slug", "title", "category"],
  },
  courses: {
    model: "product",
    fields: courseFields,
    required: ["slug", "type", "title", "price"],
    listWhere: { group: "core" },
    fixedFields: { group: "core" },
  },
  booklets: {
    model: "product",
    fields: bookletFields,
    required: ["slug", "type", "title", "price"],
    listWhere: { group: "resource" },
    fixedFields: { group: "resource" },
  },
  stats: {
    model: "stat",
    fields: ["slug", "label", "value", "order"],
    required: ["slug", "label"],
  },
  awards: {
    model: "award",
    fields: ["org", "title", "description", "imageUrl", "order"],
    required: ["org", "title", "description"],
  },
  "digital-impact": {
    model: "digitalImpact",
    fields: ["platform", "value", "label", "url", "order"],
    required: ["platform", "value", "label"],
  },
  tasks: {
    model: "currentTask",
    fields: ["text", "completed", "tag", "tagHref", "order"],
    required: ["text"],
  },
  "career-highlights": {
    model: "careerHighlight",
    fields: ["text", "order"],
    required: ["text"],
  },
  "client-logos": {
    model: "clientLogo",
    fields: ["name", "logoUrl", "order"],
    required: ["name"],
  },
  testimonials: {
    model: "testimonial",
    fields: ["quote", "name", "title", "order"],
    required: ["quote", "name", "title"],
  },
  faqs: {
    model: "faq",
    fields: ["question", "answer", "order"],
    required: ["question", "answer"],
  },
  socials: {
    model: "socialLink",
    fields: ["platform", "url", "order", "enabled"],
    required: ["platform", "url"],
  },
} satisfies Record<string, CollectionConfig>;

export type CollectionName = keyof typeof collections;

export function isCollection(value: string): value is CollectionName {
  return value in collections;
}

/** الحقول المسموح كتابتها فقط — أي حقل غيرها يُتجاهل */
export function pickFields(
  collection: CollectionName,
  payload: Record<string, unknown>,
) {
  const config = collections[collection] as CollectionConfig;
  const allowed = config.fields as readonly string[];
  const picked = Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowed.includes(key)),
  );
  return {
    ...picked,
    ...(config.fixedFields ?? {}),
  };
}

export function missingRequired(
  collection: CollectionName,
  data: Record<string, unknown>,
) {
  return collections[collection].required.filter(
    (field) => data[field] === undefined || data[field] === "",
  );
}

export function collectionListWhere(collection: CollectionName) {
  const config = collections[collection] as CollectionConfig;
  return config.listWhere ?? {};
}

type Delegate = {
  findMany(args?: unknown): Promise<unknown>;
  findUnique(args: unknown): Promise<unknown>;
  findFirst(args?: unknown): Promise<unknown>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
};

export function getDelegate(
  prisma: PrismaClient,
  collection: CollectionName,
): Delegate {
  return prisma[collections[collection].model] as unknown as Delegate;
}
