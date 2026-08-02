import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    orderBy: { order: "asc" },
    select: { title: true, order: true, slug: true },
  });
  console.log(projects);
}

main().finally(() => prisma.$disconnect());
