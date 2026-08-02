import { redirect } from "next/navigation";
import { MyCoursesView, type MyCourseItem } from "@/components/my-courses/my-courses-view";
import { getCustomerSession } from "@/lib/customer-auth";
import { getPrisma } from "@/lib/prisma";

export const metadata = {
  title: "دوراتي",
  description: "طلبات شراء الدورات وحالة كل طلب",
};

export default async function MyCoursesPage() {
  const session = await getCustomerSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent("/my-courses")}`);
  }

  const prisma = getPrisma();
  if (!prisma) {
    return (
      <MyCoursesView customerName={session.name} courses={[]} />
    );
  }

  const requests = await prisma.coursePurchaseRequest.findMany({
    where: { customerId: session.id },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          title: true,
          type: true,
          price: true,
          description: true,
          imageUrl: true,
          coverImageUrl: true,
        },
      },
    },
  });

  const seen = new Set<string>();
  const courses: MyCourseItem[] = [];
  for (const row of requests) {
    if (seen.has(row.productId)) continue;
    seen.add(row.productId);
    courses.push({
      id: row.id,
      status: row.status,
      adminNote: row.adminNote,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      product: row.product,
    });
  }

  return <MyCoursesView customerName={session.name} courses={courses} />;
}
