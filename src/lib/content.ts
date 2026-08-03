import { cache } from "react";
import { unstable_cache } from "next/cache";
import { sections, statLabels } from "@/lib/fixed-content";
import { getPrisma, isDatabaseConfigured, withDbRetry } from "@/lib/prisma";
import {
  careerHighlightsPlaceholder,
  currentTasksPlaceholder,
  productsPlaceholder,
  projectGalleryPlaceholder,
  projectsPlaceholder,
  statsPlaceholder,
} from "@/lib/placeholder-content";
import {
  demoAwards,
  demoBanner,
  demoClientLogos,
  demoDigitalImpact,
  demoFaqs,
  demoTestimonials,
  isDemoContentEnabled,
} from "@/lib/demo-content";
import {
  defaultDemoBookletDetail,
  demoBookletsExtra,
} from "@/lib/demo-booklet";
import {
  parseProductFiles,
  toPublicProductFiles,
} from "@/lib/product-files";

function logContentFailure(label: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  // نص فقط — تمرير Error كامل يفعّل Error Overlay في Next حتى لو الـ catch يعمل
  console.warn(`[content] ${label}:`, message.split("\n")[0] ?? message);
}
const CONTENT_REVALIDATE = 60;
const CONTENT_TAG = "site-content";

function cached<T>(key: string[], loader: () => Promise<T>) {
  return unstable_cache(loader, key, {
    revalidate: CONTENT_REVALIDATE,
    tags: [CONTENT_TAG],
  })();
}

/** حقول بطاقة المنتج فقط — بدون JSON الثقيل (courseWatch/courseDetail/files) */
const productCardSelect = {
  id: true,
  slug: true,
  type: true,
  title: true,
  description: true,
  price: true,
  ctaLabel: true,
  href: true,
  imageUrl: true,
  group: true,
} as const;

const projectCardSelect = {
  id: true,
  slug: true,
  title: true,
  category: true,
  imageUrl: true,
  href: true,
} as const;

const bookletDetailSelect = {
  id: true,
  slug: true,
  type: true,
  title: true,
  description: true,
  body: true,
  price: true,
  imageUrl: true,
  coverImageUrl: true,
  files: true,
  downloadsCount: true,
} as const;

const courseDetailSelect = {
  id: true,
  slug: true,
  type: true,
  title: true,
  description: true,
  price: true,
  ctaLabel: true,
  href: true,
  imageUrl: true,
  coverImageUrl: true,
  courseDetail: true,
} as const;

export type SettingsView = {
  designerName: string;
  siteName: string;
  siteTagline: string;
  avatarUrl: string | null;
  heroImageUrl: string | null;
  brandMarkUrl: string | null;
  navbarLogoUrl: string | null;
  footerLogoUrl: string | null;
  footerDescription: string | null;
  availableForWork: boolean;
  contactEmail: string | null;
  contactPhone: string | null;
  contactLocation: string | null;
  whatsappUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  telegramUrl: string | null;
};

export type StatView = { slug: string; label: string; value: string };
export type ProjectView = {
  id: string;
  slug: string;
  title: string;
  category: string;
  imageUrl: string | null;
  href: string;
};

export type ProjectMetaItem = { label: string; value: string };

export type ProjectGalleryItem = {
  imageUrl: string | null;
  caption?: string | null;
  layout: "full" | "half";
  aspect?: string;
};

export type ProjectDetailView = {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string | null;
  meta: ProjectMetaItem[];
  /** صور دراسة الحالة بالترتيب — مصدر واحد للعرض */
  gallery: ProjectGalleryItem[];
  externalCaseStudyUrl: string | null;
  externalCaseStudyLabel: string | null;
};
export type ProductView = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  price: string;
  ctaLabel: string;
  imageUrl: string | null;
  href: string;
  /** core = الدورات التدريبية، resource = مكتبة الكتيبات */
  group: "core" | "resource";
};
export type BannerView = {
  badgeLabel: string;
  title: string;
  contentType: string | null;
  ctaLabel: string | null;
  href: string | null;
  imageUrl: string | null;
} | null;
export type AwardView = {
  id: string;
  org: string;
  title: string;
  description: string;
  imageUrl: string | null;
};
export type DigitalImpactView = {
  id: string;
  platform: string;
  value: string;
  label: string;
  url: string | null;
};
export type TaskView = {
  id: string;
  text: string;
  completed: boolean;
  tag: string | null;
  tagHref: string | null;
};
export type HighlightView = { id: string; text: string };
export type ClientLogoView = {
  id: string;
  name: string;
  logoUrl: string | null;
};
export type TestimonialView = {
  id: string;
  quote: string;
  name: string;
  title: string;
};
export type FaqView = { id: string; question: string; answer: string };
export type SocialView = { id: string; platform: string; url: string };

export type HomeContent = {
  settings: SettingsView;
  socials: SocialView[];
  stats: StatView[];
  projects: ProjectView[];
  products: ProductView[];
  banner: BannerView;
  awards: AwardView[];
  digitalImpact: DigitalImpactView[];
  tasks: TaskView[];
  highlights: HighlightView[];
  clientLogos: ClientLogoView[];
  testimonials: TestimonialView[];
  faqs: FaqView[];
};

const defaultSettings: SettingsView = {
  designerName: "منتظر",
  siteName: "منتظر",
  siteTagline: "مُصمّم هُويّات بصريّة",
  avatarUrl: null,
  heroImageUrl: null,
  brandMarkUrl: null,
  navbarLogoUrl: null,
  footerLogoUrl: null,
  footerDescription: null,
  availableForWork: true,
  contactEmail: "hello@muntadhar.studio",
  contactPhone: "+964 770 123 4567",
  contactLocation: "بغداد، العراق",
  whatsappUrl: null,
  instagramUrl: null,
  facebookUrl: null,
  telegramUrl: null,
};

/** التسميات الأربع ثابتة دائماً من fixed-content */
/**
 * الحالة قبل ربط Supabase: تُعرض الصفحة كاملة بالمحتوى الابتدائي والتجريبي
 * عشان يشوف المصمم كل الأقسام عند DEMO_CONTENT=on. بدونها ترجع الأقسام اللي ما لها
 * محتوى ابتدائي في page-home.json لسلوك emptyState الطبيعي.
 */
function placeholderHomeContent(): HomeContent {
  const demo = isDemoContentEnabled;

  return {
    settings: defaultSettings,
    socials: [],
    stats: statsPlaceholder.map(({ slug, label, value }) => ({
      slug,
      label,
      value,
    })),
    projects: projectsPlaceholder.slice(0, 3).map((project) => ({
      id: project.slug,
      slug: project.slug,
      title: project.title,
      category: project.category,
      imageUrl: null,
      href: `/projects/${project.slug}`,
    })),
    products: productsPlaceholder.map((product) => ({
      id: product.slug,
      type: product.type,
      title: product.title,
      description: product.description,
      price: product.price,
      ctaLabel: product.ctaLabel,
      imageUrl: null,
      href: `/products/${product.slug}`,
      group: product.group as "core" | "resource",
    })),
    banner: demo
      ? {
          badgeLabel: demoBanner.badgeLabel,
          title: demoBanner.title,
          contentType: demoBanner.contentType,
          ctaLabel: demoBanner.ctaLabel,
          href: demoBanner.href,
          imageUrl: demoBanner.imageUrl,
        }
      : null,
    awards: demo
      ? demoAwards.map((award, index) => ({
          id: `demo-award-${index}`,
          ...award,
          imageUrl: null,
        }))
      : [],
    digitalImpact: demo
      ? demoDigitalImpact.map((item, index) => ({
          id: `demo-impact-${index}`,
          ...item,
          url: null,
        }))
      : [],
    tasks: currentTasksPlaceholder.map((task, index) => ({
      id: `task-${index}`,
      text: task.text,
      completed: task.completed,
      tag: null,
      tagHref: null,
    })),
    highlights: careerHighlightsPlaceholder.map((highlight, index) => ({
      id: `highlight-${index}`,
      text: highlight.text,
    })),
    clientLogos: demo
      ? demoClientLogos.map((logo, index) => ({
          id: `demo-logo-${index}`,
          ...logo,
          logoUrl: null,
        }))
      : [],
    testimonials: demo
      ? demoTestimonials.map((testimonial, index) => ({
          id: `demo-testimonial-${index}`,
          ...testimonial,
        }))
      : [],
    faqs: demo
      ? demoFaqs.map((faq, index) => ({ id: `demo-faq-${index}`, ...faq }))
      : [],
  };
}

export const getHomeContent = cache(async (): Promise<HomeContent> =>
  // v2: كسر كاش emptyStats بعد انقطاعات الشبكة
  cached(["home-content-v3"], loadHomeContent),
);

async function loadHomeContent(): Promise<HomeContent> {
  const prisma = getPrisma();
  if (!prisma) return placeholderHomeContent();

  try {
    const byOrder = { orderBy: { order: "asc" as const } };

    const [
      settings,
      socials,
      stats,
      projects,
      products,
      banner,
      awards,
      digitalImpact,
      tasks,
      highlights,
      clientLogos,
      testimonials,
      faqs,
    ] = await withDbRetry((db) =>
      Promise.all([
        db.siteSettings.findUnique({ where: { id: "default" } }),
        db.socialLink.findMany({ where: { enabled: true }, ...byOrder }),
        db.stat.findMany(byOrder),
        db.project.findMany({
          where: { published: true },
          orderBy: [{ order: "asc" }, { createdAt: "desc" }],
          take: 3,
          select: projectCardSelect,
        }),
        db.product.findMany({
          where: { published: true },
          orderBy: [{ order: "asc" }, { createdAt: "desc" }],
          take: 3,
          select: productCardSelect,
        }),
        db.featuredBanner.findUnique({ where: { id: "default" } }),
        db.award.findMany(byOrder),
        db.digitalImpact.findMany(byOrder),
        db.currentTask.findMany(byOrder),
        db.careerHighlight.findMany(byOrder),
        db.clientLogo.findMany(byOrder),
        db.testimonial.findMany(byOrder),
        db.faq.findMany(byOrder),
      ]),
    );

    const statsBySlug = new Map(stats.map((stat) => [stat.slug, stat.value]));

    return {
      settings: mapSettings(settings),
      socials: socials.map(({ id, platform, url }) => ({ id, platform, url })),
      stats: statLabels.map(({ slug, label }) => ({
        slug,
        label,
        value: statsBySlug.get(slug) ?? "",
      })),
      projects: projects.map((project) => ({
        id: project.id,
        slug: project.slug,
        title: project.title,
        category: project.category,
        imageUrl: project.imageUrl,
        // بطاقة المشروع دائماً لصفحة التفاصيل — لا تعتمد على href الفارغ من اللوحة
        href: `/projects/${project.slug}`,
      })),
      products: products.map((product) => ({
        id: product.id,
        type: product.type,
        title: product.title,
        description: product.description,
        price: product.price,
        ctaLabel: product.ctaLabel,
        imageUrl: product.imageUrl,
        href: `/products/${product.slug}`,
        group: product.group === "core" ? "core" : "resource",
      })),
      banner:
        banner?.enabled && banner.title
          ? {
              badgeLabel: banner.badgeLabel?.trim() || sections.featuredBanner.tag,
              title: banner.title,
              contentType: banner.contentType,
              ctaLabel: banner.ctaLabel,
              href: banner.href,
              imageUrl: banner.imageUrl,
            }
          : null,
      awards: awards.map(({ id, org, title, description, imageUrl }) => ({
        id,
        org,
        title,
        description,
        imageUrl,
      })),
      digitalImpact: digitalImpact.map(
        ({ id, platform, value, label, url }) => ({
          id,
          platform,
          value,
          label,
          url,
        }),
      ),
      tasks: tasks.map(({ id, text, completed, tag, tagHref }) => ({
        id,
        text,
        completed,
        tag,
        tagHref,
      })),
      highlights: highlights.map(({ id, text }) => ({ id, text })),
      clientLogos: clientLogos.map(({ id, name, logoUrl }) => ({
        id,
        name,
        logoUrl,
      })),
      testimonials: testimonials.map(({ id, quote, name, title }) => ({
        id,
        quote,
        name,
        title,
      })),
      faqs: faqs.map(({ id, question, answer }) => ({ id, question, answer })),
    };
  } catch (error) {
    // قاعدة البيانات مضبوطة لكن غير متاحة (شبكة/migration ناقص):
    // نعرض الحد الأدنى بدل ما تنكسر الصفحة الرئيسية.
    logContentFailure("فشل جلب محتوى الصفحة الرئيسية", error);
    // لا تُفرَّغ العدادات/المشاريع عند فشل الشبكة — وإلا يظهر — وكروت فارغة
    return placeholderHomeContent();
  }
}

export type ProjectsPageContent = {
  settings: SettingsView;
  socials: SocialView[];
  projects: ProjectView[];
};

function mapSettings(
  settings: {
    designerName: string;
    siteName: string;
    siteTagline?: string | null;
    avatarUrl: string | null;
    heroImageUrl: string | null;
    brandMarkUrl: string | null;
    navbarLogoUrl?: string | null;
    footerLogoUrl: string | null;
    footerDescription: string | null;
    availableForWork: boolean;
    contactEmail: string | null;
    contactPhone: string | null;
    contactLocation: string | null;
    whatsappUrl: string | null;
    instagramUrl: string | null;
    facebookUrl: string | null;
    telegramUrl: string | null;
  } | null,
): SettingsView {
  if (!settings) return defaultSettings;
  return {
    designerName: settings.designerName,
    siteName: settings.siteName,
    siteTagline:
      settings.siteTagline?.trim() || defaultSettings.siteTagline,
    avatarUrl: settings.avatarUrl,
    heroImageUrl: settings.heroImageUrl,
    brandMarkUrl: settings.brandMarkUrl,
    navbarLogoUrl: settings.navbarLogoUrl ?? null,
    footerLogoUrl: settings.footerLogoUrl,
    footerDescription: settings.footerDescription,
    availableForWork: settings.availableForWork,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    contactLocation: settings.contactLocation,
    whatsappUrl: settings.whatsappUrl,
    instagramUrl: settings.instagramUrl,
    facebookUrl: settings.facebookUrl,
    telegramUrl: settings.telegramUrl,
  };
}

function mapProjects(
  projects: {
    id: string;
    slug: string;
    title: string;
    category: string;
    imageUrl: string | null;
    href: string | null;
  }[],
): ProjectView[] {
  return projects.map((project) => ({
    id: project.id,
    slug: project.slug,
    title: project.title,
    category: project.category,
    imageUrl: project.imageUrl,
    href: `/projects/${project.slug}`,
  }));
}

function placeholderProjectsPageContent(): ProjectsPageContent {
  return {
    settings: defaultSettings,
    socials: [],
    projects: projectsPlaceholder.map((project) => ({
      id: project.slug,
      slug: project.slug,
      title: project.title,
      category: project.category,
      imageUrl: null,
      href: `/projects/${project.slug}`,
    })),
  };
}

/** محتوى صفحة /projects — كل المشاريع المنشورة */
export const getProjectsPageContent = cache(
  async (): Promise<ProjectsPageContent> =>
    cached(["projects-page-v2"], loadProjectsPageContent),
);

async function loadProjectsPageContent(): Promise<ProjectsPageContent> {
  const prisma = getPrisma();
  if (!prisma) return placeholderProjectsPageContent();

  try {
    const [settings, socials, projects] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { id: "default" } }),
      prisma.socialLink.findMany({
        where: { enabled: true },
        orderBy: { order: "asc" },
      }),
      prisma.project.findMany({
        where: { published: true },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        select: projectCardSelect,
      }),
    ]);

    return {
      settings: mapSettings(settings),
      socials: socials.map(({ id, platform, url }) => ({ id, platform, url })),
      projects: mapProjects(projects),
    };
  } catch (error) {
    logContentFailure("فشل جلب محتوى صفحة الأعمال", error);
    // عند فشل الشبكة: placeholder بدل قائمة فارغة حتى لا يُخزَّن empty في الكاش
    return placeholderProjectsPageContent();
  }
}

/** إعدادات + روابط اجتماعية فقط — بدون جلب المشاريع (للناف بار/فوتر) */
export const getSiteChrome = cache(async (): Promise<{
  settings: SettingsView;
  socials: SocialView[];
}> => cached(["site-chrome-v4"], loadSiteChrome));

async function loadSiteChrome(): Promise<{
  settings: SettingsView;
  socials: SocialView[];
}> {
  const prisma = getPrisma();
  if (!prisma) return { settings: defaultSettings, socials: [] };

  try {
    const [settings, socials] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { id: "default" } }),
      prisma.socialLink.findMany({
        where: { enabled: true },
        orderBy: { order: "asc" },
      }),
    ]);

    return {
      settings: mapSettings(settings),
      socials: socials.map(({ id, platform, url }) => ({ id, platform, url })),
    };
  } catch (error) {
    logContentFailure("فشل جلب إعدادات الموقع", error);
    return { settings: defaultSettings, socials: [] };
  }
}

export type HandbookPageContent = {
  settings: SettingsView;
  socials: SocialView[];
  faqs: FaqView[];
};

function placeholderFaqs(): FaqView[] {
  return isDemoContentEnabled
    ? demoFaqs.map((faq, index) => ({ id: `demo-faq-${index}`, ...faq }))
    : [];
}

/** محتوى صفحة /handbook — نصوص المنهجية ثابتة، والأسئلة من قاعدة البيانات (مشتركة مع الرئيسية) */
export const getHandbookPageContent = cache(
  async (): Promise<HandbookPageContent> =>
    cached(["handbook-page"], loadHandbookPageContent),
);

async function loadHandbookPageContent(): Promise<HandbookPageContent> {
  const prisma = getPrisma();
  if (!prisma) {
    return {
      settings: defaultSettings,
      socials: [],
      faqs: placeholderFaqs(),
    };
  }

  try {
    const [settings, socials, faqs] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { id: "default" } }),
      prisma.socialLink.findMany({
        where: { enabled: true },
        orderBy: { order: "asc" },
      }),
      prisma.faq.findMany({ orderBy: { order: "asc" } }),
    ]);

    return {
      settings: mapSettings(settings),
      socials: socials.map(({ id, platform, url }) => ({ id, platform, url })),
      faqs: faqs.map(({ id, question, answer }) => ({ id, question, answer })),
    };
  } catch (error) {
    logContentFailure("فشل جلب محتوى صفحة المنهجية", error);
    return { settings: defaultSettings, socials: [], faqs: [] };
  }
}

export type ProductsPageContent = {
  settings: SettingsView;
  socials: SocialView[];
  corePrograms: ProductView[];
  resources: ProductView[];
};

function mapProduct(product: {
  id: string;
  slug: string;
  type: string;
  title: string;
  description: string | null;
  price: string;
  ctaLabel: string;
  href: string | null;
  imageUrl: string | null;
  group: string;
}): ProductView {
  return {
    id: product.id,
    type: product.type,
    title: product.title,
    description: product.description,
    price: product.price,
    ctaLabel: product.ctaLabel,
    imageUrl: product.imageUrl,
    href: `/products/${product.slug}`,
    group: product.group === "core" ? "core" : "resource",
  };
}

function placeholderProductsPageContent(): ProductsPageContent {
  const products = productsPlaceholder.map((product) =>
    mapProduct({
      id: product.slug,
      slug: product.slug,
      type: product.type,
      title: product.title,
      description: product.description,
      price: product.price,
      ctaLabel: product.ctaLabel,
      href: null,
      imageUrl: null,
      group: product.group,
    }),
  );

  return {
    settings: defaultSettings,
    socials: [],
    corePrograms: products.filter((p) => p.group === "core"),
    resources: products.filter((p) => p.group === "resource"),
  };
}

/** محتوى صفحة /products — الدورات التدريبية + مكتبة الكتيبات */
export const getProductsPageContent = cache(
  async (): Promise<ProductsPageContent> =>
    cached(["products-page"], loadProductsPageContent),
);

async function loadProductsPageContent(): Promise<ProductsPageContent> {
  const prisma = getPrisma();
  if (!prisma) return placeholderProductsPageContent();

  try {
    const [settings, socials, products] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { id: "default" } }),
      prisma.socialLink.findMany({
        where: { enabled: true },
        orderBy: { order: "asc" },
      }),
      prisma.product.findMany({
        where: { published: true },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        select: productCardSelect,
      }),
    ]);

    const mapped = products.map(mapProduct);

    return {
      settings: mapSettings(settings),
      socials: socials.map(({ id, platform, url }) => ({ id, platform, url })),
      corePrograms: mapped.filter((p) => p.group === "core"),
      resources: mapped.filter((p) => p.group === "resource"),
    };
  } catch (error) {
    logContentFailure("فشل جلب محتوى صفحة المنتجات", error);
    return {
      settings: defaultSettings,
      socials: [],
      corePrograms: [],
      resources: [],
    };
  }
}

function parseMeta(value: unknown): ProjectMetaItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is { label: string; value: string } =>
        !!item &&
        typeof item === "object" &&
        typeof (item as { label?: unknown }).label === "string" &&
        typeof (item as { value?: unknown }).value === "string",
    )
    .map(({ label, value: metaValue }) => ({ label, value: metaValue }));
}

function parseGallery(value: unknown): ProjectGalleryItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null,
      caption: typeof item.caption === "string" ? item.caption : null,
      layout: "full" as const,
      aspect: "3240:1350",
    }));
}

function buildProjectCaseGallery(input: {
  logoImageUrl?: string | null;
  coverImageUrl?: string | null;
  brandGallery: ProjectGalleryItem[];
  applicationGallery: ProjectGalleryItem[];
}): ProjectGalleryItem[] {
  const frames: ProjectGalleryItem[] = [];
  const seen = new Set<string>();

  function push(item: ProjectGalleryItem) {
    const url = item.imageUrl?.trim();
    if (!url || seen.has(url)) return;
    seen.add(url);
    frames.push({ ...item, imageUrl: url });
  }

  // المشاريع الجديدة: صور brandGallery فقط تكفي
  // المشاريع القديمة: ندمج الشعار/الغلاف/المعارض دون تكرار
  if (input.logoImageUrl) {
    push({
      imageUrl: input.logoImageUrl,
      caption: null,
      layout: "full",
      aspect: "3240:1350",
    });
  }
  if (input.coverImageUrl) {
    push({
      imageUrl: input.coverImageUrl,
      caption: null,
      layout: "full",
      aspect: "3240:1350",
    });
  }
  for (const item of input.brandGallery) push(item);
  for (const item of input.applicationGallery) push(item);

  return frames;
}

function placeholderProjectDetail(slug: string): ProjectDetailView | null {
  const project = projectsPlaceholder.find((item) => item.slug === slug);
  if (!project) return null;

  return {
    id: project.slug,
    slug: project.slug,
    title: project.title,
    category: project.category,
    description: project.description,
    meta: project.meta ?? [],
    gallery: buildProjectCaseGallery({
      brandGallery: projectGalleryPlaceholder.brand,
      applicationGallery: projectGalleryPlaceholder.application,
    }),
    externalCaseStudyUrl: project.externalCaseStudyUrl ?? null,
    externalCaseStudyLabel: project.externalCaseStudyLabel ?? null,
  };
}

export type ProjectDetailPageContent = {
  settings: SettingsView;
  socials: SocialView[];
  project: ProjectDetailView;
};

/** محتوى صفحة /projects/[slug] — كل حقول الـ case study ديناميكية */
export const getProjectDetailPageContent = cache(
  async (slug: string): Promise<ProjectDetailPageContent | null> =>
    // مفتاح كاش محدّث لكسر نتائج null القديمة بعد انقطاع الشبكة
    cached(["project-detail-v4", slug], () => loadProjectDetailPageContent(slug)),
);

async function loadProjectDetailPageContent(
  slug: string,
): Promise<ProjectDetailPageContent | null> {
  const prisma = getPrisma();
  if (!prisma) {
    const project = placeholderProjectDetail(slug);
    if (!project) return null;
    return { settings: defaultSettings, socials: [], project };
  }

  try {
    const [settings, socials, project] = await withDbRetry((db) =>
      Promise.all([
        db.siteSettings.findUnique({ where: { id: "default" } }),
        db.socialLink.findMany({
          where: { enabled: true },
          orderBy: { order: "asc" },
        }),
        db.project.findFirst({
          where: { slug, published: true },
        }),
      ]),
    );

    if (!project) {
      const fallback = placeholderProjectDetail(slug);
      if (!fallback) return null;
      return {
        settings: mapSettings(settings),
        socials: socials.map(({ id, platform, url }) => ({ id, platform, url })),
        project: fallback,
      };
    }

    const brandGallery = parseGallery(project.brandGallery);
    const applicationGallery = parseGallery(project.applicationGallery);
    const gallery = buildProjectCaseGallery({
      logoImageUrl: project.logoImageUrl,
      coverImageUrl: project.coverImageUrl,
      brandGallery:
        brandGallery.length > 0
          ? brandGallery
          : isDemoContentEnabled
            ? projectGalleryPlaceholder.brand
            : [],
      applicationGallery:
        applicationGallery.length > 0
          ? applicationGallery
          : isDemoContentEnabled && brandGallery.length === 0
            ? projectGalleryPlaceholder.application
            : [],
    });

    return {
      settings: mapSettings(settings),
      socials: socials.map(({ id, platform, url }) => ({ id, platform, url })),
      project: {
        id: project.id,
        slug: project.slug,
        title: project.title,
        category: project.category,
        description: project.description,
        meta: parseMeta(project.meta),
        gallery,
        externalCaseStudyUrl: project.externalCaseStudyUrl,
        externalCaseStudyLabel: project.externalCaseStudyLabel,
      },
    };
  } catch (error) {
    logContentFailure("فشل جلب تفاصيل المشروع", error);
    // لا نرجع null عند انقطاع الشبكة — وإلا تُخزَّن 404 في الكاش
    const project = placeholderProjectDetail(slug);
    if (!project) return null;
    return { settings: defaultSettings, socials: [], project };
  }
}

export async function getPublishedProjectSlugs(): Promise<string[]> {
  const prisma = getPrisma();
  if (!prisma) return projectsPlaceholder.map((project) => project.slug);

  try {
    const projects = await prisma.project.findMany({
      where: { published: true },
      select: { slug: true },
      orderBy: { order: "asc" },
    });
    return projects.map((project) => project.slug);
  } catch {
    return projectsPlaceholder.map((project) => project.slug);
  }
}

export type BookletFileView = { name: string };

export type BookletDetailView = {
  id: string;
  slug: string;
  type: string;
  title: string;
  description: string | null;
  body: string | null;
  price: string;
  imageUrl: string | null;
  coverImageUrl: string | null;
  files: BookletFileView[];
  downloadsCount: number;
  averageRating: number;
  reviewsCount: number;
  detail: import("@/lib/demo-booklet").DemoBookletDetail;
  reviews: import("@/lib/demo-booklet").DemoBookletReview[];
};

export type BookletDetailPageContent = {
  settings: SettingsView;
  socials: SocialView[];
  booklet: BookletDetailView;
  related: ProductView[];
  entitled: boolean;
};

function enrichBookletDetail(
  booklet: Omit<
    BookletDetailView,
    "detail" | "reviews" | "averageRating" | "reviewsCount" | "files" | "downloadsCount"
  > & {
    files?: BookletFileView[];
    downloadsCount?: number;
  },
): BookletDetailView {
  const demo = defaultDemoBookletDetail;
  const rawFiles =
    booklet.files && booklet.files.length > 0
      ? booklet.files
      : isDemoContentEnabled
        ? demo.files
        : [];
  const files = toPublicProductFiles(rawFiles);
  const downloadsCount =
    typeof booklet.downloadsCount === "number" && booklet.downloadsCount > 0
      ? booklet.downloadsCount
      : isDemoContentEnabled
        ? demo.downloadsCount
        : booklet.downloadsCount ?? 0;

  return {
    ...booklet,
    files,
    downloadsCount,
    averageRating: isDemoContentEnabled ? demo.averageRating : 0,
    reviewsCount: isDemoContentEnabled ? demo.reviewsCount : 0,
    detail: demo,
    reviews: isDemoContentEnabled ? demo.reviews : [],
  };
}

function placeholderBookletDetail(slug: string): BookletDetailView | null {
  const fromMain = productsPlaceholder.find(
    (item) => item.slug === slug && item.group === "resource",
  );
  const fromExtra = demoBookletsExtra.find((item) => item.slug === slug);
  const product = fromMain ?? fromExtra;
  if (!product) return null;

  return enrichBookletDetail({
    id: product.slug,
    slug: product.slug,
    type: product.type,
    title: product.title,
    description: product.description,
    body: "body" in product ? (product.body as string | null) : null,
    price: product.price,
    imageUrl: null,
    coverImageUrl: null,
    files: "files" in product ? (product.files as BookletFileView[]) : [],
    downloadsCount:
      "downloadsCount" in product
        ? Number((product as { downloadsCount?: number }).downloadsCount ?? 0)
        : 0,
  });
}

function relatedPlaceholderProducts(slug: string): ProductView[] {
  const all = [
    ...productsPlaceholder.filter((p) => p.group === "resource"),
    ...demoBookletsExtra,
  ];
  return all
    .filter((p) => p.slug !== slug)
    .slice(0, 3)
    .map((p) =>
      mapProduct({
        id: p.slug,
        slug: p.slug,
        type: p.type,
        title: p.title,
        description: p.description,
        price: p.price,
        ctaLabel: p.ctaLabel,
        href: null,
        imageUrl: null,
        group: "resource",
      }),
    );
}

/** صفحة تفاصيل كتيّب فقط (group=resource) */
export const getBookletDetailPageContent = cache(
  async (
    slug: string,
    customerId?: string | null,
  ): Promise<BookletDetailPageContent | null> => {
    const base = await cached(["booklet-detail-v2", slug], () =>
      loadBookletDetailBase(slug),
    );
    if (!base) return null;

    let entitled = false;
    if (customerId) {
      const prisma = getPrisma();
      if (prisma) {
        try {
          const row = await prisma.customerEntitlement.findUnique({
            where: {
              customerId_productId: {
                customerId,
                productId: base.booklet.id,
              },
            },
          });
          entitled = Boolean(row);
        } catch {
          entitled = false;
        }
      }
    }

    return { ...base, entitled };
  },
);

async function loadBookletDetailBase(
  slug: string,
): Promise<Omit<BookletDetailPageContent, "entitled"> | null> {
  const prisma = getPrisma();
  if (!prisma) {
    const booklet = placeholderBookletDetail(slug);
    if (!booklet) return null;
    return {
      settings: defaultSettings,
      socials: [],
      booklet,
      related: relatedPlaceholderProducts(slug),
    };
  }

  try {
    const [settings, socials, product, relatedRows] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { id: "default" } }),
      prisma.socialLink.findMany({
        where: { enabled: true },
        orderBy: { order: "asc" },
      }),
      prisma.product.findFirst({
        where: { slug, published: true, group: "resource" },
        select: bookletDetailSelect,
      }),
      prisma.product.findMany({
        where: { published: true, group: "resource", NOT: { slug } },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        take: 6,
        select: productCardSelect,
      }),
    ]);

    if (!product) {
      const fallback = placeholderBookletDetail(slug);
      if (!fallback) return null;
      return {
        settings: mapSettings(settings),
        socials: socials.map(({ id, platform, url }) => ({ id, platform, url })),
        booklet: fallback,
        related:
          relatedRows.length > 0
            ? relatedRows.map(mapProduct)
            : relatedPlaceholderProducts(slug),
      };
    }

    let related = relatedRows.map(mapProduct);
    if (related.length === 0 && isDemoContentEnabled) {
      related = relatedPlaceholderProducts(slug);
    }

    return {
      settings: mapSettings(settings),
      socials: socials.map(({ id, platform, url }) => ({ id, platform, url })),
      booklet: enrichBookletDetail({
        id: product.id,
        slug: product.slug,
        type: product.type,
        title: product.title,
        description: product.description,
        body: product.body,
        price: product.price,
        imageUrl: product.imageUrl,
        coverImageUrl: product.coverImageUrl ?? product.imageUrl,
        files: toPublicProductFiles(parseProductFiles(product.files)),
        downloadsCount: product.downloadsCount,
      }),
      related,
    };
  } catch (error) {
    logContentFailure("فشل جلب تفاصيل الكتيّب", error);
    return null;
  }
}

export async function getPublishedBookletSlugs(): Promise<string[]> {
  const prisma = getPrisma();
  const fallback = [
    ...productsPlaceholder.filter((p) => p.group === "resource").map((p) => p.slug),
    ...demoBookletsExtra.map((p) => p.slug),
  ];

  if (!prisma) return fallback;

  try {
    const products = await prisma.product.findMany({
      where: { published: true, group: "resource" },
      select: { slug: true },
      orderBy: { order: "asc" },
    });
    const slugs = products.map((p) => p.slug);
    return slugs.length > 0 ? slugs : fallback;
  } catch {
    return fallback;
  }
}

export async function getPublishedProductSlugs(): Promise<string[]> {
  const prisma = getPrisma();
  const fallback = [
    ...productsPlaceholder.map((p) => p.slug),
    ...demoBookletsExtra.map((p) => p.slug),
  ];

  if (!prisma) return fallback;

  try {
    const products = await prisma.product.findMany({
      where: { published: true },
      select: { slug: true },
      orderBy: { order: "asc" },
    });
    const slugs = products.map((p) => p.slug);
    return slugs.length > 0 ? slugs : fallback;
  } catch {
    return fallback;
  }
}

export type CourseDetailPageContent = {
  course: import("@/lib/course-detail").CoursePageData;
};

export const getCourseDetailPageContent = cache(
  async (slug: string): Promise<CourseDetailPageContent | null> =>
    cached([`course-detail-${slug}`], () => loadCourseDetail(slug)),
);

async function loadCourseDetail(
  slug: string,
): Promise<CourseDetailPageContent | null> {
  const {
    defaultDemoCourseDetail,
    mergeCourseDetail,
  } = await import("@/lib/course-detail");

  const prisma = getPrisma();
  if (!prisma) {
    const placeholder = productsPlaceholder.find(
      (p) => p.slug === slug && p.group === "core",
    );
    if (!placeholder) return null;
    return {
      course: {
        id: placeholder.slug,
        slug: placeholder.slug,
        title: placeholder.title,
        type: placeholder.type,
        description: placeholder.description,
        price: placeholder.price,
        ctaLabel: placeholder.ctaLabel,
        imageUrl: null,
        coverImageUrl: null,
        href: null,
        detail: defaultDemoCourseDetail(placeholder.title, placeholder.price),
      },
    };
  }

  try {
    const product = await prisma.product.findFirst({
      where: { slug, published: true, group: "core" },
      select: courseDetailSelect,
    });

    if (!product) {
      const placeholder = productsPlaceholder.find(
        (p) => p.slug === slug && p.group === "core",
      );
      if (!placeholder || !isDemoContentEnabled) return null;
      return {
        course: {
          id: placeholder.slug,
          slug: placeholder.slug,
          title: placeholder.title,
          type: placeholder.type,
          description: placeholder.description,
          price: placeholder.price,
          ctaLabel: placeholder.ctaLabel,
          imageUrl: null,
          coverImageUrl: null,
          href: null,
          detail: defaultDemoCourseDetail(placeholder.title, placeholder.price),
        },
      };
    }

    return {
      course: {
        id: product.id,
        slug: product.slug,
        title: product.title,
        type: product.type,
        description: product.description,
        price: product.price,
        ctaLabel: product.ctaLabel,
        imageUrl: product.imageUrl,
        coverImageUrl: product.coverImageUrl,
        href: product.href,
        detail: mergeCourseDetail(
          product.courseDetail,
          product.title,
          product.price,
          product.href,
        ),
      },
    };
  } catch {
    return null;
  }
}

export { isDatabaseConfigured };
