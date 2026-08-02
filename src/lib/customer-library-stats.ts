import type { PrismaClient } from "@prisma/client";

/** عدد الدورات (core) والكتيبات (resource) التي يملك العميل صلاحيتها */
export async function getCustomerLibraryStats(
  prisma: PrismaClient,
  customerId: string,
) {
  const [courses, booklets] = await Promise.all([
    prisma.customerEntitlement.count({
      where: {
        customerId,
        product: { group: "core" },
      },
    }),
    prisma.customerEntitlement.count({
      where: {
        customerId,
        product: { group: "resource" },
      },
    }),
  ]);

  return { courses, booklets };
}
