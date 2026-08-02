import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getPrisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customer-auth";
import { CoursePurchaseForm } from "@/components/product-detail/course-purchase-form";
import { mergeCourseDetail } from "@/lib/course-detail";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CoursePurchasePage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getCustomerSession();
  const nextPath = `/products/${slug}/purchase`;

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const prisma = getPrisma();
  if (!prisma) notFound();

  const product = await prisma.product.findFirst({
    where: { slug, published: true, group: "core" },
  });
  if (!product) notFound();

  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: {
      qiCardAccount: true,
      zainCashAccount: true,
      whatsappUrl: true,
    },
  });

  const detail = mergeCourseDetail(
    product.courseDetail,
    product.title,
    product.price,
    product.href,
  );

  const heroImage = detail.hero.imageUrl.trim();
  const imageUrl =
    product.coverImageUrl || product.imageUrl || heroImage || null;

  return (
    <main className="bg-page pb-16 text-ink">
      <section className="border-b border-line bg-[linear-gradient(180deg,#f3f7f6_0%,#ffffff_78%)]">
        <div className="container-site py-10 md:py-14">
          <p className="text-sm text-ink-muted">
            <Link href={`/products/${slug}`} className="hover:underline">
              العودة للدورة
            </Link>
            <span className="mx-2 text-line">/</span>
            شراء الدورة
          </p>
          <h1 className="mt-3 font-arabic-bold text-3xl md:text-4xl">
            شراء الدورة
          </h1>
          <p className="mt-2 max-w-2xl text-ink-secondary">
            أكمل التحويل المالي وارفع صورة الإيصال لإرسال طلب الشراء للمراجعة.
          </p>
        </div>
      </section>

      <section className="container-site py-10 md:py-14">
        <CoursePurchaseForm
          course={{
            id: product.id,
            slug: product.slug,
            title: product.title,
            type: product.type,
            description: product.description,
            price: detail.pricing.price || product.price,
            imageUrl: product.imageUrl,
            coverImageUrl: imageUrl,
          }}
          qiCardAccount={settings?.qiCardAccount?.trim() || ""}
          zainCashAccount={settings?.zainCashAccount?.trim() || ""}
          supportWhatsappUrl={settings?.whatsappUrl?.trim() || ""}
          customerName={session.name}
        />
      </section>
    </main>
  );
}
