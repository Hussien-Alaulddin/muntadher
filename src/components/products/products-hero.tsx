import { productsPage } from "@/lib/fixed-content";
import { BrandMark } from "@/components/brand-mark";

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-bold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

/**
 * هيرو أرشيف المنتجات — محاذاة البداية داخل container-site كما في المرجع
 * (عرض الفقرة ~493px، تمييز أسماء المسارات بخط عريض).
 */
export function ProductsHero({
  brandMarkUrl,
}: {
  brandMarkUrl?: string | null;
}) {
  return (
    <section id="products-hero" className="py-[50px] md:py-[66px]">
      <div className="container-site flex flex-col items-start gap-6">
        <span className="inline-flex items-center gap-2 rounded-[24px] border border-ink/10 px-3 py-1">
          <BrandMark src={brandMarkUrl} />
          <span className="text-micro text-ink">{productsPage.badge}</span>
        </span>

        <h1 className="max-w-[280px] text-[32px] leading-[1.3] font-bold tracking-[-0.03em] md:max-w-[320px] md:text-[38px]">
          {productsPage.heading}
        </h1>

        <p className="max-w-[493px] text-lead text-ink">
          <RichText text={productsPage.paragraphs.join(" ")} />
        </p>
      </div>
    </section>
  );
}
