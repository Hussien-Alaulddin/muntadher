/**
 * أنواع ومساعدات محتوى صفحة تفاصيل الدورة.
 * الهيكل المرجعي: src/data/course-detail-template.json
 */
import template from "@/data/course-detail-template.json";

export const COURSE_ICON_OPTIONS = [
  { value: "video", label: "فيديو" },
  { value: "files", label: "ملفات" },
  { value: "pen", label: "قلم" },
  { value: "pencil", label: "تحرير" },
  { value: "brush", label: "فرشاة" },
  { value: "presentation", label: "عرض" },
  { value: "percent", label: "نسبة" },
  { value: "newspaper", label: "مقال" },
  { value: "link", label: "رابط" },
  { value: "check", label: "صح" },
  { value: "star", label: "نجمة" },
  { value: "users", label: "مستخدمون" },
  { value: "zap", label: "برق" },
] as const;

export type CourseIconName = (typeof COURSE_ICON_OPTIONS)[number]["value"];

export type CourseFeatureItem = { icon: CourseIconName; label: string };

export type CourseStatItem = {
  value: string;
  prefix: string;
  suffix: string;
  label: string;
  description: string;
};

export type CourseMediaSection = {
  eyebrow: string;
  title: string;
  description: string;
  tags: string[];
  images: string[];
};

export type CourseModuleItem = {
  label: string;
  title: string;
  description: string;
  lessonsLabel: string;
  lessons: string[];
  imageUrl: string;
};

export type CourseBonusItem = { icon: CourseIconName; label: string };

export type CourseInteractiveItem = { title: string; description: string };

export type CourseReviewItem = {
  quote: string;
  name: string;
  rating: number;
};

export type CourseSocialItem = { platform: string; url: string };

export type CourseDetailContent = {
  hero: {
    notice: string;
    title: string;
    subtitle: string;
    features: CourseFeatureItem[];
    imageUrl: string;
    /** فيديو تعريفي يظهر تحت العنوان إن وُجد */
    introVideoUrl: string;
  };
  stats: CourseStatItem[];
  skills: CourseMediaSection;
  methodology: CourseMediaSection;
  modulesSection: {
    eyebrow: string;
    title: string;
    description: string;
    modules: CourseModuleItem[];
  };
  bonuses: {
    title: string;
    items: CourseBonusItem[];
  };
  interactive: {
    eyebrow: string;
    title: string;
    description: string;
    items: CourseInteractiveItem[];
    imageUrl: string;
  };
  reviews: {
    eyebrow: string;
    title: string;
    items: CourseReviewItem[];
  };
  instructor: {
    eyebrow: string;
    name: string;
    bio: string;
    imageUrl: string;
    socials: CourseSocialItem[];
  };
  pricing: {
    title: string;
    price: string;
    originalPrice: string;
    ctaLabel: string;
    ctaHref: string;
    secureNote: string;
  };
};

export type CoursePageData = {
  id: string;
  slug: string;
  title: string;
  type: string;
  description: string | null;
  price: string;
  ctaLabel: string;
  imageUrl: string | null;
  coverImageUrl: string | null;
  href: string | null;
  detail: CourseDetailContent;
};

type ParseOptions = { keepEmpty?: boolean };

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asStringList(value: unknown, keepEmpty = false): string[] {
  if (!Array.isArray(value)) return [];
  if (keepEmpty) return value.map((item) => String(item ?? ""));
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function asIcon(value: unknown): CourseIconName {
  const raw = asString(value);
  const found = COURSE_ICON_OPTIONS.find((item) => item.value === raw);
  return found?.value ?? "check";
}

function asFeatures(
  value: unknown,
  keepEmpty = false,
): CourseFeatureItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (typeof row === "string") {
        const label = keepEmpty ? row : row.trim();
        if (!keepEmpty && !label) return null;
        return { icon: "check" as const, label };
      }
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const label = keepEmpty
        ? asString(item.label)
        : asString(item.label).trim();
      if (!keepEmpty && !label) return null;
      return { icon: asIcon(item.icon), label };
    })
    .filter((row): row is CourseFeatureItem => Boolean(row));
}

function asStats(value: unknown, keepEmpty = false): CourseStatItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const label = keepEmpty
        ? asString(item.label)
        : asString(item.label).trim();
      const rawValue = keepEmpty
        ? asString(item.value)
        : asString(item.value).trim();
      if (!keepEmpty && (!label || !rawValue)) return null;
      return {
        value: keepEmpty
          ? rawValue
          : rawValue.replace(/[^\d.]/g, "") || rawValue,
        prefix: asString(item.prefix),
        suffix: asString(item.suffix),
        label,
        description: keepEmpty
          ? asString(item.description)
          : asString(item.description).trim(),
      };
    })
    .filter((row): row is CourseStatItem => Boolean(row));
}

function asMediaSection(
  value: unknown,
  fallback: CourseMediaSection,
  keepEmpty = false,
): CourseMediaSection {
  if (!value || typeof value !== "object") return fallback;
  const item = value as Record<string, unknown>;
  const tags = Array.isArray(item.tags)
    ? asStringList(item.tags, keepEmpty)
    : fallback.tags;
  const images = Array.isArray(item.images)
    ? asStringList(item.images, keepEmpty)
    : fallback.images;
  return {
    eyebrow: asString(item.eyebrow) || (keepEmpty ? "" : fallback.eyebrow),
    title: asString(item.title) || (keepEmpty ? "" : fallback.title),
    description:
      asString(item.description) || (keepEmpty ? "" : fallback.description),
    tags: keepEmpty || tags.length > 0 ? tags : fallback.tags,
    images: keepEmpty || images.length > 0 ? images : fallback.images,
  };
}

function asModules(value: unknown, keepEmpty = false): CourseModuleItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const title = keepEmpty
        ? asString(item.title)
        : asString(item.title).trim();
      if (!keepEmpty && !title) return null;
      return {
        label: keepEmpty
          ? asString(item.label)
          : asString(item.label).trim(),
        title,
        description: keepEmpty
          ? asString(item.description)
          : asString(item.description).trim(),
        lessonsLabel: keepEmpty
          ? asString(item.lessonsLabel) || "دروس المحور"
          : asString(item.lessonsLabel).trim() || "دروس المحور",
        lessons: asStringList(item.lessons, keepEmpty),
        imageUrl: keepEmpty
          ? asString(item.imageUrl)
          : asString(item.imageUrl).trim(),
      };
    })
    .filter((row): row is CourseModuleItem => Boolean(row));
}

function asBonuses(value: unknown, keepEmpty = false): CourseBonusItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (typeof row === "string") {
        const label = keepEmpty ? row : row.trim();
        if (!keepEmpty && !label) return null;
        return { icon: "check" as const, label };
      }
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const label = keepEmpty
        ? asString(item.label)
        : asString(item.label).trim();
      if (!keepEmpty && !label) return null;
      return { icon: asIcon(item.icon), label };
    })
    .filter((row): row is CourseBonusItem => Boolean(row));
}

function asInteractive(
  value: unknown,
  keepEmpty = false,
): CourseInteractiveItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const title = keepEmpty
        ? asString(item.title)
        : asString(item.title).trim();
      if (!keepEmpty && !title) return null;
      return {
        title,
        description: keepEmpty
          ? asString(item.description)
          : asString(item.description).trim(),
      };
    })
    .filter((row): row is CourseInteractiveItem => Boolean(row));
}

function asReviews(value: unknown, keepEmpty = false): CourseReviewItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const quote = keepEmpty
        ? asString(item.quote)
        : asString(item.quote).trim();
      const name = keepEmpty
        ? asString(item.name)
        : asString(item.name).trim();
      if (!keepEmpty && (!quote || !name)) return null;
      const rating = Number(item.rating);
      return {
        quote,
        name,
        rating: Number.isFinite(rating) ? Math.min(5, Math.max(1, rating)) : 5,
      };
    })
    .filter((row): row is CourseReviewItem => Boolean(row));
}

function asSocials(value: unknown, keepEmpty = false): CourseSocialItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const platform = keepEmpty
        ? asString(item.platform)
        : asString(item.platform).trim();
      if (!keepEmpty && !platform) return null;
      return {
        platform,
        url: keepEmpty ? asString(item.url) : asString(item.url).trim(),
      };
    })
    .filter((row): row is CourseSocialItem => Boolean(row));
}

export function emptyCourseDetail(): CourseDetailContent {
  return {
    hero: {
      notice: "",
      title: "",
      subtitle: "",
      features: [],
      imageUrl: "",
      introVideoUrl: "",
    },
    stats: [],
    skills: {
      eyebrow: "المهارات",
      title: "",
      description: "",
      tags: [],
      images: [],
    },
    methodology: {
      eyebrow: "المنهجيّة",
      title: "",
      description: "",
      tags: [],
      images: [],
    },
    modulesSection: {
      eyebrow: "مواضيع ممنهجة",
      title: "محتوى الدورة",
      description: "",
      modules: [],
    },
    bonuses: { title: "بالإضافة الى", items: [] },
    interactive: {
      eyebrow: "دورة تفاعلية",
      title: "",
      description: "",
      items: [],
      imageUrl: "",
    },
    reviews: {
      eyebrow: "",
      title: "تقييمات المتدربين",
      items: [],
    },
    instructor: {
      eyebrow: "عن المدرب",
      name: "",
      bio: "",
      imageUrl: "",
      socials: [],
    },
    pricing: {
      title: "",
      price: "",
      originalPrice: "",
      ctaLabel: "سجل الآن",
      ctaHref: "",
      secureNote: "",
    },
  };
}

export function defaultDemoCourseDetail(
  title: string,
  price: string,
): CourseDetailContent {
  const base = parseCourseDetail(template);
  return {
    ...base,
    hero: {
      ...base.hero,
      title: title || base.hero.title,
    },
    pricing: {
      ...base.pricing,
      price: price || base.pricing.price,
      title:
        base.pricing.title ||
        `احصل على ${title} مع الانضمام لمجموعة خاصة بالتحديثات`,
    },
  };
}

/** يدعم الهيكل الجديد + الحقول القديمة المسطّحة للتوافق */
export function parseCourseDetail(
  value: unknown,
  options: ParseOptions = {},
): CourseDetailContent {
  const keepEmpty = Boolean(options.keepEmpty);
  const empty = emptyCourseDetail();
  if (!value || typeof value !== "object") return empty;
  const raw = value as Record<string, unknown>;

  // هيكل جديد متداخل
  if (raw.hero && typeof raw.hero === "object") {
    const hero = raw.hero as Record<string, unknown>;
    const modulesSection =
      raw.modulesSection && typeof raw.modulesSection === "object"
        ? (raw.modulesSection as Record<string, unknown>)
        : {};
    const bonuses =
      raw.bonuses && typeof raw.bonuses === "object"
        ? (raw.bonuses as Record<string, unknown>)
        : {};
    const interactive =
      raw.interactive && typeof raw.interactive === "object"
        ? (raw.interactive as Record<string, unknown>)
        : {};
    const reviews =
      raw.reviews && typeof raw.reviews === "object"
        ? (raw.reviews as Record<string, unknown>)
        : {};
    const instructor =
      raw.instructor && typeof raw.instructor === "object"
        ? (raw.instructor as Record<string, unknown>)
        : {};
    const pricing =
      raw.pricing && typeof raw.pricing === "object"
        ? (raw.pricing as Record<string, unknown>)
        : {};

    return {
      hero: {
        notice: asString(hero.notice),
        title: asString(hero.title),
        subtitle: asString(hero.subtitle),
        features: asFeatures(hero.features, keepEmpty),
        imageUrl: asString(hero.imageUrl),
        introVideoUrl: asString(hero.introVideoUrl),
      },
      stats: asStats(raw.stats, keepEmpty),
      skills: asMediaSection(raw.skills, empty.skills, keepEmpty),
      methodology: asMediaSection(
        raw.methodology,
        empty.methodology,
        keepEmpty,
      ),
      modulesSection: {
        eyebrow:
          asString(modulesSection.eyebrow) ||
          (keepEmpty ? "" : empty.modulesSection.eyebrow),
        title:
          asString(modulesSection.title) ||
          (keepEmpty ? "" : empty.modulesSection.title),
        description: asString(modulesSection.description),
        modules: asModules(modulesSection.modules, keepEmpty),
      },
      bonuses: {
        title:
          asString(bonuses.title) || (keepEmpty ? "" : empty.bonuses.title),
        items: asBonuses(bonuses.items, keepEmpty),
      },
      interactive: {
        eyebrow:
          asString(interactive.eyebrow) ||
          (keepEmpty ? "" : empty.interactive.eyebrow),
        title: asString(interactive.title),
        description: asString(interactive.description),
        items: asInteractive(interactive.items, keepEmpty),
        imageUrl: asString(interactive.imageUrl),
      },
      reviews: {
        eyebrow: asString(reviews.eyebrow),
        title:
          asString(reviews.title) || (keepEmpty ? "" : empty.reviews.title),
        items: asReviews(reviews.items, keepEmpty),
      },
      instructor: {
        eyebrow:
          asString(instructor.eyebrow) ||
          (keepEmpty ? "" : empty.instructor.eyebrow),
        name: asString(instructor.name),
        bio: asString(instructor.bio),
        imageUrl: asString(instructor.imageUrl),
        socials: asSocials(instructor.socials, keepEmpty),
      },
      pricing: {
        title: asString(pricing.title),
        price: asString(pricing.price),
        originalPrice: asString(pricing.originalPrice),
        ctaLabel:
          asString(pricing.ctaLabel) ||
          (keepEmpty ? "" : empty.pricing.ctaLabel),
        ctaHref: asString(pricing.ctaHref),
        secureNote: asString(pricing.secureNote),
      },
    };
  }

  // توافق مع الهيكل القديم المسطّح
  return {
    hero: {
      notice: asString(raw.notice),
      title: "",
      subtitle: asString(raw.subtitle),
      features: asFeatures(raw.heroFeatures, keepEmpty),
      imageUrl: "",
      introVideoUrl: "",
    },
    stats: asStats(raw.stats, keepEmpty).map((stat) => ({
      ...stat,
      prefix: stat.prefix || "",
      suffix: stat.suffix || "",
    })),
    skills: {
      eyebrow: "المهارات",
      title: asString(raw.skillsTitle),
      description: asString(raw.skillsDescription),
      tags: asStringList(raw.skillsTags, keepEmpty),
      images: [],
    },
    methodology: {
      eyebrow: "المنهجيّة",
      title: asString(raw.methodologyTitle),
      description: asString(raw.methodologyDescription),
      tags: asStringList(raw.methodologyTags, keepEmpty),
      images: [],
    },
    modulesSection: {
      eyebrow: "مواضيع ممنهجة",
      title: asString(raw.modulesTitle) || "محتوى الدورة",
      description: asString(raw.modulesDescription),
      modules: asModules(raw.modules, keepEmpty),
    },
    bonuses: {
      title: asString(raw.bonusesTitle) || "بالإضافة الى",
      items: asBonuses(raw.bonuses, keepEmpty),
    },
    interactive: {
      eyebrow: asString(raw.interactiveEyebrow) || "دورة تفاعلية",
      title: asString(raw.interactiveTitle),
      description: asString(raw.interactiveDescription),
      items: asInteractive(raw.interactiveItems, keepEmpty),
      imageUrl: "",
    },
    reviews: {
      eyebrow: asString(raw.reviewsEyebrow),
      title: asString(raw.reviewsTitle) || "تقييمات المتدربين",
      items: asReviews(raw.reviews, keepEmpty),
    },
    instructor: {
      eyebrow: asString(raw.instructorEyebrow) || "عن المدرب",
      name: asString(raw.instructorName),
      bio: asString(raw.instructorBio),
      imageUrl: asString(raw.instructorImageUrl),
      socials: [],
    },
    pricing: {
      title: asString(raw.offerText),
      price: asString(raw.offerPrice),
      originalPrice: asString(raw.offerOriginalPrice),
      ctaLabel: asString(raw.enrollLabel) || "سجل الآن",
      ctaHref: asString(raw.enrollHref),
      secureNote: asString(raw.offerSecureNote),
    },
  };
}

export function cleanCourseDetail(value: unknown): CourseDetailContent {
  return parseCourseDetail(value);
}

export function mergeCourseDetail(
  stored: unknown,
  title: string,
  price: string,
  href?: string | null,
): CourseDetailContent {
  const demo = defaultDemoCourseDetail(title, price);
  const parsed = parseCourseDetail(stored);

  const pick = (value: string, fallback: string) =>
    value.trim() ? value : fallback;

  const hasCustom =
    parsed.hero.features.length > 0 ||
    parsed.stats.length > 0 ||
    parsed.modulesSection.modules.length > 0 ||
    Boolean(parsed.hero.subtitle.trim()) ||
    Boolean(parsed.skills.title.trim());

  if (!hasCustom) {
    return {
      ...demo,
      hero: {
        ...demo.hero,
        title: title || demo.hero.title,
        imageUrl: demo.hero.imageUrl,
        introVideoUrl: parsed.hero.introVideoUrl.trim(),
      },
      pricing: {
        ...demo.pricing,
        price: price || demo.pricing.price,
        ctaHref: href?.trim() || demo.pricing.ctaHref,
      },
    };
  }

  return {
    hero: {
      notice: pick(parsed.hero.notice, demo.hero.notice),
      title: pick(parsed.hero.title, title || demo.hero.title),
      subtitle: pick(parsed.hero.subtitle, demo.hero.subtitle),
      features:
        parsed.hero.features.length > 0
          ? parsed.hero.features
          : demo.hero.features,
      imageUrl: pick(parsed.hero.imageUrl, demo.hero.imageUrl),
      // لا نستخدم فيديو تجريبي — يظهر فقط إن رفعه المسؤول
      introVideoUrl: parsed.hero.introVideoUrl.trim(),
    },
    stats: parsed.stats.length > 0 ? parsed.stats : demo.stats,
    skills: {
      eyebrow: pick(parsed.skills.eyebrow, demo.skills.eyebrow),
      title: pick(parsed.skills.title, demo.skills.title),
      description: pick(parsed.skills.description, demo.skills.description),
      tags: parsed.skills.tags.length > 0 ? parsed.skills.tags : demo.skills.tags,
      images:
        parsed.skills.images.length > 0
          ? parsed.skills.images
          : demo.skills.images,
    },
    methodology: {
      eyebrow: pick(parsed.methodology.eyebrow, demo.methodology.eyebrow),
      title: pick(parsed.methodology.title, demo.methodology.title),
      description: pick(
        parsed.methodology.description,
        demo.methodology.description,
      ),
      tags:
        parsed.methodology.tags.length > 0
          ? parsed.methodology.tags
          : demo.methodology.tags,
      images:
        parsed.methodology.images.length > 0
          ? parsed.methodology.images
          : demo.methodology.images,
    },
    modulesSection: {
      eyebrow: pick(
        parsed.modulesSection.eyebrow,
        demo.modulesSection.eyebrow,
      ),
      title: pick(parsed.modulesSection.title, demo.modulesSection.title),
      description: pick(
        parsed.modulesSection.description,
        demo.modulesSection.description,
      ),
      modules: (
        parsed.modulesSection.modules.length > 0
          ? parsed.modulesSection.modules
          : demo.modulesSection.modules
      ).map((mod, index) => ({
        ...mod,
        imageUrl:
          mod.imageUrl.trim() ||
          demo.modulesSection.modules[index]?.imageUrl ||
          "",
      })),
    },
    bonuses: {
      title: pick(parsed.bonuses.title, demo.bonuses.title),
      items:
        parsed.bonuses.items.length > 0
          ? parsed.bonuses.items
          : demo.bonuses.items,
    },
    interactive: {
      eyebrow: pick(parsed.interactive.eyebrow, demo.interactive.eyebrow),
      title: pick(parsed.interactive.title, demo.interactive.title),
      description: pick(
        parsed.interactive.description,
        demo.interactive.description,
      ),
      items:
        parsed.interactive.items.length > 0
          ? parsed.interactive.items
          : demo.interactive.items,
      imageUrl: pick(parsed.interactive.imageUrl, demo.interactive.imageUrl),
    },
    reviews: {
      eyebrow: pick(parsed.reviews.eyebrow, demo.reviews.eyebrow),
      title: pick(parsed.reviews.title, demo.reviews.title),
      items:
        parsed.reviews.items.length > 0
          ? parsed.reviews.items
          : demo.reviews.items,
    },
    instructor: {
      eyebrow: pick(parsed.instructor.eyebrow, demo.instructor.eyebrow),
      name: pick(parsed.instructor.name, demo.instructor.name),
      bio: pick(parsed.instructor.bio, demo.instructor.bio),
      imageUrl: pick(parsed.instructor.imageUrl, demo.instructor.imageUrl),
      socials:
        parsed.instructor.socials.length > 0
          ? parsed.instructor.socials
          : demo.instructor.socials,
    },
    pricing: {
      title: pick(parsed.pricing.title, demo.pricing.title),
      price: pick(parsed.pricing.price, price || demo.pricing.price),
      originalPrice: pick(
        parsed.pricing.originalPrice,
        demo.pricing.originalPrice,
      ),
      ctaLabel: pick(parsed.pricing.ctaLabel, demo.pricing.ctaLabel),
      ctaHref: pick(
        parsed.pricing.ctaHref,
        href?.trim() || demo.pricing.ctaHref,
      ),
      secureNote: pick(parsed.pricing.secureNote, demo.pricing.secureNote),
    },
  };
}
