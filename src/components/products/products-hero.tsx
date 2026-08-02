import { productsPage } from "@/lib/fixed-content";
import { StarBadgeIcon } from "@/components/icons";

/**
 * هيرو أرشيف المنتجات — محاذاة البداية داخل container-site كما في المرجع
 * (عرض الفقرة ~493px، تمييز أسماء البرامج بخط عريض).
 */
export function ProductsHero() {
  const { paragraph } = productsPage;

  return (
    <section id="products-hero" className="py-[50px] md:py-[66px]">
      <div className="container-site flex flex-col items-start gap-6">
        <span className="inline-flex items-center gap-2 rounded-[24px] border border-ink/10 px-3 py-1">
          <StarBadgeIcon className="size-3.5 shrink-0 text-accent-blue" />
          <span className="text-micro text-ink">{productsPage.badge}</span>
        </span>

        <h1 className="max-w-[280px] text-[32px] leading-[1.3] font-bold tracking-[-0.03em] md:max-w-[320px] md:text-[38px]">
          {productsPage.heading}
        </h1>

        <p className="max-w-[493px] text-lead text-ink">
          {paragraph.before}
          <strong className="font-bold">{paragraph.bold1}</strong>
          {paragraph.mid}
          <strong className="font-bold">{paragraph.bold2}</strong>
          {paragraph.after}
        </p>
      </div>
    </section>
  );
}
