import { PrismaClient } from "@prisma/client";
import {
  careerHighlightsPlaceholder,
  currentTasksPlaceholder,
  productsPlaceholder,
  projectsPlaceholder,
  statsPlaceholder,
} from "../src/lib/placeholder-content";
import {
  demoAwards,
  demoBanner,
  demoClientLogos,
  demoDigitalImpact,
  demoFaqs,
  demoTestimonials,
} from "../src/lib/demo-content";
import { projectFormQuestionsSeed } from "../src/lib/project-form";

const prisma = new PrismaClient();

/**
 * المحتوى التجريبي يُزرع افتراضياً عشان يستلم المصمم موقعاً كامل المحتوى
 * يعدّله من لوحة التحكم. لزراعة الهيكل فقط بدون محتوى تجريبي: SEED_DEMO=off
 */
const seedDemo = process.env.SEED_DEMO !== "off";

async function main() {
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });

  await prisma.featuredBanner.upsert({
    where: { id: "default" },
    create: seedDemo ? { id: "default", ...demoBanner } : { id: "default" },
    update: {},
  });

  for (const [index, stat] of statsPlaceholder.entries()) {
    await prisma.stat.upsert({
      where: { slug: stat.slug },
      create: { ...stat, order: index + 1 },
      update: { label: stat.label, order: index + 1 },
    });
  }

  for (const [index, project] of projectsPlaceholder.entries()) {
    const {
      slug,
      title,
      category,
      description,
      meta,
      externalCaseStudyUrl,
      externalCaseStudyLabel,
    } = project;

    await prisma.project.upsert({
      where: { slug },
      create: {
        slug,
        title,
        category,
        description,
        meta,
        externalCaseStudyUrl: externalCaseStudyUrl ?? null,
        externalCaseStudyLabel: externalCaseStudyLabel ?? null,
        order: index + 1,
      },
      update: {
        description,
        meta,
        externalCaseStudyUrl: externalCaseStudyUrl ?? null,
        externalCaseStudyLabel: externalCaseStudyLabel ?? null,
      },
    });
  }

  for (const [index, product] of productsPlaceholder.entries()) {
    const { body, ...rest } = product as typeof product & { body?: string };
    await prisma.product.upsert({
      where: { slug: product.slug },
      create: {
        ...rest,
        body: body ?? null,
        order: index + 1,
      },
      update: {
        description: product.description,
        group: product.group,
        type: product.type,
        title: product.title,
        price: product.price,
        ctaLabel: product.ctaLabel,
        ...(body ? { body } : {}),
      },
    });
  }

  // كتيبات تجريبية إضافية — لملء صفحة التفاصيل والمنتجات المشابهة
  const { demoBookletsExtra, defaultDemoBookletDetail } = await import(
    "@/lib/demo-booklet"
  );
  let bookletOrder = productsPlaceholder.length + 1;
  for (const booklet of [
    {
      slug: "colors-guide",
      type: "كتيّب إلكتروني",
      title: "دليل اختيار الألوان",
      description:
        "مرجع رقمي موجه للمصممين لضمان اختيار ألوان متماسكة في الهوية",
      price: "مجاني",
      ctaLabel: "تحميل مجاني",
      group: "resource",
      downloadsCount: defaultDemoBookletDetail.downloadsCount,
      files: defaultDemoBookletDetail.files,
      body: defaultDemoBookletDetail.bodyIntro,
    },
    ...demoBookletsExtra,
  ]) {
    await prisma.product.upsert({
      where: { slug: booklet.slug },
      create: {
        slug: booklet.slug,
        type: booklet.type,
        title: booklet.title,
        description: booklet.description,
        body: booklet.body,
        price: booklet.price,
        ctaLabel: booklet.ctaLabel,
        group: booklet.group,
        downloadsCount: booklet.downloadsCount,
        files: booklet.files,
        order: bookletOrder++,
        published: true,
      },
      update: {
        description: booklet.description,
        body: booklet.body,
        downloadsCount: booklet.downloadsCount,
        files: booklet.files,
        group: "resource",
        published: true,
      },
    });
  }

  if ((await prisma.currentTask.count()) === 0) {
    await prisma.currentTask.createMany({
      data: currentTasksPlaceholder.map((task, index) => ({
        ...task,
        order: index + 1,
      })),
    });
  }

  if ((await prisma.careerHighlight.count()) === 0) {
    await prisma.careerHighlight.createMany({
      data: careerHighlightsPlaceholder.map((highlight, index) => ({
        ...highlight,
        order: index + 1,
      })),
    });
  }

  // محتوى تجريبي لبقية الأقسام: جوائز، تأثير رقمي، شهادات، شعارات، أسئلة.
  // نصوصه موسومة "تجريبي" ولازم يستبدلها المصمم قبل الإطلاق للعامة.
  if (seedDemo) {
    if ((await prisma.award.count()) === 0) {
      await prisma.award.createMany({
        data: demoAwards.map((award, index) => ({
          ...award,
          order: index + 1,
        })),
      });
    }

    if ((await prisma.digitalImpact.count()) === 0) {
      await prisma.digitalImpact.createMany({
        data: demoDigitalImpact.map((item, index) => ({
          ...item,
          order: index + 1,
        })),
      });
    }

    if ((await prisma.testimonial.count()) === 0) {
      await prisma.testimonial.createMany({
        data: demoTestimonials.map((testimonial, index) => ({
          ...testimonial,
          order: index + 1,
        })),
      });
    }

    if ((await prisma.clientLogo.count()) === 0) {
      await prisma.clientLogo.createMany({
        data: demoClientLogos.map((logo, index) => ({
          ...logo,
          order: index + 1,
        })),
      });
    }

    if ((await prisma.faq.count()) === 0) {
      await prisma.faq.createMany({
        data: demoFaqs.map((faq, index) => ({ ...faq, order: index + 1 })),
      });
    }
  }

  for (const question of projectFormQuestionsSeed) {
    await prisma.projectFormQuestion.upsert({
      where: { key: question.key },
      create: {
        key: question.key,
        heading: question.heading,
        subtext: question.subtext ?? null,
        type: question.type,
        required: question.required,
        options: question.options ?? undefined,
        order: question.order,
        enabled: true,
      },
      update: {
        heading: question.heading,
        subtext: question.subtext ?? null,
        type: question.type,
        required: question.required,
        options: question.options ?? undefined,
        order: question.order,
        enabled: true,
      },
    });
  }

  console.log(
    seedDemo
      ? "تمت زراعة البيانات الابتدائية والمحتوى التجريبي."
      : "تمت زراعة البيانات الابتدائية بدون محتوى تجريبي.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
