import { unstable_cache } from "next/cache";
import {
  getHandbookPageContent,
  getHomeContent,
  getProductsPageContent,
  getProjectsPageContent,
} from "@/lib/content";
import { getPublicProjectForm } from "@/lib/get-project-form";
import { getPrisma, withDbRetry } from "@/lib/prisma";
import {
  handbookPage,
  hero,
  navbar,
  productsPage,
  projectsPage,
} from "@/lib/fixed-content";
import { projectRequestHref } from "@/lib/project-form";
import type { ChatAssistantContext } from "@/lib/site-assistant";

const MAX_KNOWLEDGE_CHARS = 8_000;
const CONTENT_TAG = "site-content";

function clip(text: string | null | undefined, max = 220): string {
  const value = (text ?? "").replace(/\s+/g, " ").trim();
  if (!value) return "";
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function pushLine(lines: string[], line: string) {
  if (line.trim()) lines.push(line.trim());
}

type ProjectExtra = {
  slug: string;
  description: string | null;
  meta: unknown;
  externalCaseStudyUrl: string | null;
  externalCaseStudyLabel: string | null;
};

type ProductExtra = {
  slug: string;
  body: string | null;
  files: unknown;
};

function parseMeta(value: unknown): Array<{ label: string; value: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label = String((item as { label?: unknown }).label ?? "").trim();
      const text = String((item as { value?: unknown }).value ?? "").trim();
      if (!label || !text) return null;
      return { label, value: text };
    })
    .filter((item): item is { label: string; value: string } => Boolean(item));
}

function fileNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      return String((item as { name?: unknown }).name ?? "").trim();
    })
    .filter(Boolean)
    .slice(0, 6);
}

async function loadExtras(): Promise<{
  projects: ProjectExtra[];
  products: ProductExtra[];
}> {
  const prisma = getPrisma();
  if (!prisma) return { projects: [], products: [] };

  try {
    return await withDbRetry(async (db) => {
      const [projects, products] = await Promise.all([
        db.project.findMany({
          where: { published: true },
          orderBy: [{ order: "asc" }, { createdAt: "desc" }],
          take: 12,
          select: {
            slug: true,
            description: true,
            meta: true,
            externalCaseStudyUrl: true,
            externalCaseStudyLabel: true,
          },
        }),
        db.product.findMany({
          where: { published: true },
          orderBy: [{ order: "asc" }, { createdAt: "desc" }],
          take: 16,
          select: {
            slug: true,
            body: true,
            files: true,
          },
        }),
      ]);
      return { projects, products };
    });
  } catch (error) {
    console.error("[chat:knowledge-extras]", error);
    return { projects: [], products: [] };
  }
}

async function buildPublicSiteKnowledge(): Promise<string> {
  const lines: string[] = [];
  const projectHref = projectRequestHref();

  pushLine(lines, "## نظرة عامة");
  pushLine(lines, `- التخصص: ${hero.badge}`);
  pushLine(lines, `- الرسالة: ${hero.heading}. ${hero.paragraph}`);
  pushLine(lines, "## قواعد الاستخدام والحساب");
  pushLine(
    lines,
    "- التصفح: يمكن لأي زائر تصفّح الموقع والأعمال والمنتجات ودليل العمل واستمارة طلب المشروع بدون حساب.",
  );
  pushLine(
    lines,
    "- التحميل: تحميل أي منتج أو كتيّب أو مورد رقمي — حتى المجاني — يتطلب إنشاء حساب أو تسجيل الدخول، ثم تفعيل صلاحية التحميل من صفحة المنتج.",
  );
  pushLine(
    lines,
    "- مهم: مجاني لا يعني بدون حساب. لا تقل إن التحميل متاح مباشرة بدون تسجيل.",
  );
  pushLine(lines, "- إنشاء حساب: /register — تسجيل الدخول: /login");
  pushLine(
    lines,
    "- طلب مشروع جديد: عبر استمارة طلب المشروع بدون الحاجة لحساب.",
  );

  try {
    const [home, projectsPageData, productsPageData, handbook, form, extras] =
      await Promise.all([
        getHomeContent(),
        getProjectsPageContent(),
        getProductsPageContent(),
        getHandbookPageContent(),
        getPublicProjectForm(),
        loadExtras(),
      ]);

    const settings = home.settings;
    pushLine(lines, `- المصمم: ${settings.designerName}`);
    pushLine(
      lines,
      `- متاح لمشاريع جديدة: ${settings.availableForWork ? "نعم" : "لا حالياً"}`,
    );
    if (settings.siteName) pushLine(lines, `- اسم الموقع: ${settings.siteName}`);
    if (settings.contactEmail) {
      pushLine(lines, `- البريد للتواصل: ${settings.contactEmail}`);
    }
    if (settings.whatsappUrl) {
      pushLine(lines, `- واتساب: ${settings.whatsappUrl}`);
    }

    if (home.socials.length) {
      pushLine(lines, "## روابط التواصل");
      for (const social of home.socials.slice(0, 8)) {
        pushLine(lines, `- ${social.platform}: ${social.url}`);
      }
    }

    pushLine(lines, "## صفحات الموقع");
    for (const link of navbar.links) {
      pushLine(lines, `- ${link.label}: ${link.href}`);
    }
    pushLine(lines, `- استمارة طلب مشروع: ${projectHref}`);

    if (home.stats.some((s) => s.value.trim())) {
      pushLine(lines, "## إحصائيات");
      for (const stat of home.stats) {
        if (!stat.value.trim()) continue;
        pushLine(lines, `- ${stat.label}: ${stat.value}`);
      }
    }

    if (home.banner) {
      pushLine(
        lines,
        `## بانر: ${home.banner.title}${home.banner.href ? ` → ${home.banner.href}` : ""}`,
      );
    }

    if (home.highlights.length) {
      pushLine(lines, "## محطات المسيرة");
      for (const item of home.highlights.slice(0, 6)) {
        pushLine(lines, `- ${clip(item.text, 140)}`);
      }
    }

    if (home.tasks.length) {
      pushLine(lines, "## أعمل حالياً على");
      for (const task of home.tasks.slice(0, 6)) {
        pushLine(
          lines,
          `- [${task.completed ? "مكتمل" : "جارٍ"}] ${clip(task.text, 120)}`,
        );
      }
    }

    if (home.awards.length) {
      pushLine(lines, "## جوائز");
      for (const award of home.awards.slice(0, 5)) {
        pushLine(
          lines,
          `- ${award.title} — ${award.org}: ${clip(award.description, 120)}`,
        );
      }
    }

    if (home.digitalImpact.length) {
      pushLine(lines, "## التأثير الرقمي");
      for (const item of home.digitalImpact.slice(0, 5)) {
        pushLine(lines, `- ${item.platform}: ${item.value} ${item.label}`);
      }
    }

    if (home.clientLogos.length) {
      pushLine(
        lines,
        `## عملاء: ${home.clientLogos
          .slice(0, 16)
          .map((c) => c.name)
          .filter(Boolean)
          .join("، ")}`,
      );
    }

    if (home.testimonials.length) {
      pushLine(lines, "## شهادات");
      for (const t of home.testimonials.slice(0, 4)) {
        pushLine(lines, `- «${clip(t.quote, 140)}» — ${t.name}`);
      }
    }

    const faqs = handbook.faqs.length ? handbook.faqs : home.faqs;
    if (faqs.length) {
      pushLine(lines, "## أسئلة شائعة");
      for (const faq of faqs.slice(0, 8)) {
        pushLine(lines, `س: ${clip(faq.question, 100)}`);
        pushLine(lines, `ج: ${clip(faq.answer, 200)}`);
      }
    }

    pushLine(lines, "## منهجية العمل");
    pushLine(lines, clip(handbookPage.paragraphs.join(" "), 220));
    for (const pillar of handbookPage.pillars) {
      pushLine(
        lines,
        `- ${pillar.title}: ${clip(pillar.paragraphs.join(" "), 140)}`,
      );
    }
    for (const step of handbookPage.steps) {
      pushLine(
        lines,
        `- خطوة ${step.number} ${step.title}: ${clip(step.paragraphs.join(" "), 140)}`,
      );
    }

    const extrasBySlug = new Map(
      extras.projects.map((item) => [item.slug, item]),
    );
    pushLine(lines, `## المشاريع (${projectsPage.heading})`);
    for (const project of projectsPageData.projects.slice(0, 12)) {
      const extra = extrasBySlug.get(project.slug);
      pushLine(
        lines,
        `- ${project.title} [${project.category}] → /projects/${project.slug}`,
      );
      if (extra?.description) {
        pushLine(lines, `  الوصف: ${clip(extra.description, 200)}`);
      }
      const meta = parseMeta(extra?.meta);
      for (const item of meta.slice(0, 4)) {
        pushLine(lines, `  ${item.label}: ${clip(item.value, 60)}`);
      }
      if (extra?.externalCaseStudyUrl) {
        pushLine(lines, `  دراسة حالة: ${extra.externalCaseStudyUrl}`);
      }
    }

    const productBodyBySlug = new Map(
      extras.products.map((item) => [item.slug, item]),
    );
    pushLine(lines, `## المنتجات (${productsPage.heading})`);
    for (const product of [
      ...productsPageData.corePrograms,
      ...productsPageData.resources,
    ].slice(0, 14)) {
      pushLine(
        lines,
        `- ${product.title} (${product.type}) — ${product.price} → ${product.href}`,
      );
      if (product.description) {
        pushLine(lines, `  ${clip(product.description, 140)}`);
      }
      const slug = product.href.startsWith("/products/")
        ? product.href.replace("/products/", "")
        : "";
      const extra = slug ? productBodyBySlug.get(slug) : undefined;
      if (extra?.body) pushLine(lines, `  تفاصيل: ${clip(extra.body, 220)}`);
      const names = fileNames(extra?.files);
      if (names.length) {
        pushLine(lines, `  ملفات (أسماء فقط): ${names.join("، ")}`);
      }
    }

    if (form.questions.length) {
      pushLine(lines, "## أسئلة استمارة طلب المشروع");
      for (const q of form.questions.slice(0, 10)) {
        const opts = q.options?.length
          ? ` | ${q.options.slice(0, 6).join(" / ")}`
          : "";
        pushLine(lines, `- ${clip(q.heading, 100)}${opts}`);
      }
    }
  } catch (error) {
    console.error("[chat:knowledge]", error);
    pushLine(
      lines,
      "تعذّر تحميل بعض المحتوى؛ وجّه الزائر لصفحات الموقع العامة.",
    );
  }

  let knowledge = lines.filter(Boolean).join("\n");
  if (knowledge.length > MAX_KNOWLEDGE_CHARS) {
    knowledge = `${knowledge.slice(0, MAX_KNOWLEDGE_CHARS - 1)}…`;
  }
  return knowledge;
}

/** معرفة موقعية مع كاش Next لمدة ٦٠ ثانية، ويُبطَل فوراً عند تعديل المحتوى */
let ramCache: { value: string; expires: number } | null = null;

export function clearPublicSiteKnowledgeCache() {
  ramCache = null;
}

export async function getPublicSiteKnowledgeCached(
  _ctx?: ChatAssistantContext,
): Promise<string> {
  if (ramCache && ramCache.expires > Date.now()) {
    return ramCache.value;
  }

  const value = await unstable_cache(
    () => buildPublicSiteKnowledge(),
    ["chat-public-site-knowledge-v6"],
    { revalidate: 60, tags: [CONTENT_TAG] },
  )();

  ramCache = { value, expires: Date.now() + 15_000 };
  return value;
}
