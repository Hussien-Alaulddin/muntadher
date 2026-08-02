import type { ComponentType, SVGProps } from "react";
import type { ProductView } from "@/lib/content";
import { productsPage } from "@/lib/fixed-content";
import { BookIcon, LayersIcon } from "@/components/icons";
import { Section } from "@/components/ui";
import { ArchiveProductCard } from "@/components/products/archive-product-card";

function ProductSectionHeader({
  icon: Icon,
  title,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
}) {
  return (
    <div className="mb-[18px] flex min-h-9 items-center gap-2.5">
      <Icon className="size-6 shrink-0 text-accent-blue" />
      <h2 className="text-h2">{title}</h2>
    </div>
  );
}

function ProductSection({
  id,
  title,
  icon,
  products,
  emptyMessage,
}: {
  id: string;
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  products: ProductView[];
  emptyMessage: string;
}) {
  return (
    <Section id={id} className="pb-[40px] md:pb-[50px]" padded={false}>
      <ProductSectionHeader icon={icon} title={title} />
      {products.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-[15px] gap-y-2.5 md:grid-cols-2">
          {products.map((product) => (
            <ArchiveProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="rounded-card border border-dashed border-line bg-surface px-5 py-10 text-center text-lead text-ink-secondary">
          {emptyMessage}
        </p>
      )}
    </Section>
  );
}

/** قسمان: الدورات التدريبية + مكتبة الكتيبات — يظهران دائماً مع رسالة «قريباً» لو فارغين */
export function ProductsArchive({
  corePrograms,
  resources,
}: {
  corePrograms: ProductView[];
  resources: ProductView[];
}) {
  return (
    <>
      <ProductSection
        id="courses"
        title={productsPage.coursesTitle}
        icon={LayersIcon}
        products={corePrograms}
        emptyMessage={productsPage.coursesEmpty}
      />
      <ProductSection
        id="booklets"
        title={productsPage.bookletsTitle}
        icon={BookIcon}
        products={resources}
        emptyMessage={productsPage.bookletsEmpty}
      />
    </>
  );
}
