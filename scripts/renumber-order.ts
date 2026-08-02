import { PrismaClient } from "@prisma/client";

/**
 * يعيد ترقيم order لكل المجموعات ليبدأ من 1 (بدل 0)
 * مع الحفاظ على الترتيب النسبي الحالي.
 */
const prisma = new PrismaClient();

async function renumber(
  label: string,
  findMany: () => Promise<{ id: string; order: number }[]>,
  update: (id: string, order: number) => Promise<unknown>,
) {
  const items = await findMany();
  items.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

  let changed = 0;
  for (let i = 0; i < items.length; i++) {
    const next = i + 1;
    if (items[i].order !== next) {
      await update(items[i].id, next);
      changed += 1;
    }
  }
  console.log(`${label}: ${items.length} عنصر — حُدّث ${changed}`);
}

async function main() {
  await renumber(
    "projects",
    () => prisma.project.findMany({ select: { id: true, order: true } }),
    (id, order) => prisma.project.update({ where: { id }, data: { order } }),
  );
  await renumber(
    "products",
    () => prisma.product.findMany({ select: { id: true, order: true } }),
    (id, order) => prisma.product.update({ where: { id }, data: { order } }),
  );
  await renumber(
    "stats",
    () => prisma.stat.findMany({ select: { id: true, order: true } }),
    (id, order) => prisma.stat.update({ where: { id }, data: { order } }),
  );
  await renumber(
    "awards",
    () => prisma.award.findMany({ select: { id: true, order: true } }),
    (id, order) => prisma.award.update({ where: { id }, data: { order } }),
  );
  await renumber(
    "digital-impact",
    () => prisma.digitalImpact.findMany({ select: { id: true, order: true } }),
    (id, order) =>
      prisma.digitalImpact.update({ where: { id }, data: { order } }),
  );
  await renumber(
    "tasks",
    () => prisma.currentTask.findMany({ select: { id: true, order: true } }),
    (id, order) =>
      prisma.currentTask.update({ where: { id }, data: { order } }),
  );
  await renumber(
    "career-highlights",
    () =>
      prisma.careerHighlight.findMany({ select: { id: true, order: true } }),
    (id, order) =>
      prisma.careerHighlight.update({ where: { id }, data: { order } }),
  );
  await renumber(
    "client-logos",
    () => prisma.clientLogo.findMany({ select: { id: true, order: true } }),
    (id, order) =>
      prisma.clientLogo.update({ where: { id }, data: { order } }),
  );
  await renumber(
    "testimonials",
    () => prisma.testimonial.findMany({ select: { id: true, order: true } }),
    (id, order) =>
      prisma.testimonial.update({ where: { id }, data: { order } }),
  );
  await renumber(
    "faqs",
    () => prisma.faq.findMany({ select: { id: true, order: true } }),
    (id, order) => prisma.faq.update({ where: { id }, data: { order } }),
  );
  await renumber(
    "socials",
    () => prisma.socialLink.findMany({ select: { id: true, order: true } }),
    (id, order) =>
      prisma.socialLink.update({ where: { id }, data: { order } }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
