import { notFound, redirect } from "next/navigation";
import { CourseWatchView } from "@/components/course-watch/course-watch-view";
import { getCustomerSession } from "@/lib/customer-auth";
import {
  defaultCourseWatchContent,
  parseCourseWatchContent,
} from "@/lib/course-watch";
import { getPrisma } from "@/lib/prisma";
import { signCourseWatchContent } from "@/lib/sign-course-watch";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const prisma = getPrisma();
  if (!prisma) return { title: "مشاهدة الدورة" };

  const product = await prisma.product.findFirst({
    where: { slug, published: true, group: "core" },
    select: { title: true },
  });

  return {
    title: product ? `مشاهدة · ${product.title}` : "مشاهدة الدورة",
  };
}

export default async function CourseLearnPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getCustomerSession();
  const nextPath = `/products/${slug}/learn`;

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const prisma = getPrisma();
  if (!prisma) notFound();

  const product = await prisma.product.findFirst({
    where: { slug, published: true, group: "core" },
    select: { id: true, slug: true, title: true, courseWatch: true },
  });
  if (!product) notFound();

  const entitlement = await prisma.customerEntitlement.findUnique({
    where: {
      customerId_productId: {
        customerId: session.id,
        productId: product.id,
      },
    },
    select: { id: true },
  });

  // معاينة التطوير فقط بعلم صريح — لا تعتمد على NODE_ENV وحده
  const allowDevPreview =
    process.env.NODE_ENV === "development" &&
    process.env.ALLOW_DEV_COURSE_PREVIEW === "1";
  if (!entitlement && !allowDevPreview) {
    redirect(`/products/${slug}/purchase`);
  }

  const hasWatchContent =
    product.courseWatch &&
    typeof product.courseWatch === "object" &&
    Array.isArray((product.courseWatch as { sections?: unknown }).sections) &&
    ((product.courseWatch as { sections: unknown[] }).sections?.length ?? 0) > 0;

  const rawContent = hasWatchContent
    ? (() => {
        const parsed = parseCourseWatchContent(product.courseWatch);
        return {
          ...parsed,
          course: {
            ...parsed.course,
            title: parsed.course.title.trim() || product.title,
          },
        };
      })()
    : defaultCourseWatchContent(product.title);

  // روابط الفيديو/الملحقات الخاصة تُوقَّع هنا ولا تُرسل خام للمتصفح
  const content = await signCourseWatchContent(rawContent, product.id);

  return (
    <CourseWatchView
      productId={product.id}
      productSlug={product.slug}
      customerId={session.id}
      content={content}
    />
  );
}
