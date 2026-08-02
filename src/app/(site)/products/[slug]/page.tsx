import { notFound } from "next/navigation";
import {
  getBookletDetailPageContent,
  getCourseDetailPageContent,
  getPublishedProductSlugs,
} from "@/lib/content";
import { getCustomerSession } from "@/lib/customer-auth";
import { getPrisma } from "@/lib/prisma";
import { CourseDetailView } from "@/components/product-detail/course-detail-view";
import {
  BookletBody,
  BookletBreadcrumb,
  BookletCover,
  BookletReviews,
  RelatedBooklets,
} from "@/components/product-detail/booklet-sections";
import {
  DigitalFiles,
  PurchaseCard,
  StickyCtaBar,
} from "@/components/product-detail/purchase-panel";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getPublishedProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseDetailPageContent(slug);
  if (course) {
    return {
      title: course.course.title,
      description:
        course.course.detail.hero.subtitle ||
        course.course.description?.slice(0, 160) ||
        undefined,
    };
  }

  const session = await getCustomerSession();
  const content = await getBookletDetailPageContent(slug, session?.id);
  if (!content) return { title: "منتج غير موجود" };
  return {
    title: content.booklet.title,
    description: content.booklet.description?.slice(0, 160) ?? undefined,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const courseContent = await getCourseDetailPageContent(slug);
  if (courseContent) {
    const session = await getCustomerSession();
    let entitled = false;
    const prisma = getPrisma();
    if (session && prisma) {
      const row = await prisma.customerEntitlement.findUnique({
        where: {
          customerId_productId: {
            customerId: session.id,
            productId: courseContent.course.id,
          },
        },
        select: { id: true },
      });
      entitled = Boolean(row);
    }
    return (
      <CourseDetailView course={courseContent.course} entitled={entitled} />
    );
  }

  const session = await getCustomerSession();
  const content = await getBookletDetailPageContent(slug, session?.id);
  if (!content) notFound();

  const { booklet, related, entitled } = content;

  return (
    <main className="pb-8">
      <div className="container-site pt-6 md:pt-10">
        <BookletBreadcrumb title={booklet.title} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <BookletCover booklet={booklet} />
          <PurchaseCard booklet={booklet} entitled={entitled} />
        </div>

        <BookletBody detail={booklet.detail} />
        <DigitalFiles booklet={booklet} entitled={entitled} />
        <BookletReviews
          averageRating={booklet.averageRating}
          reviewsCount={booklet.reviewsCount}
          reviews={booklet.reviews}
        />
        <RelatedBooklets products={related} />
      </div>

      <StickyCtaBar booklet={booklet} entitled={entitled} />
    </main>
  );
}
