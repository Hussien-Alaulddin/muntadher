import Image from "next/image";
import Link from "@/components/link";
import type { ProductView } from "@/lib/content";
import { sections } from "@/lib/fixed-content";
import {
  ArrowEndIcon,
  BagIcon,
  FileIcon,
  productTypeIconMap,
} from "@/components/icons";
import { MediaPlaceholder, Section, SectionHeader } from "@/components/ui";
import { formatSitePrice } from "@/lib/currency";

function typeIcon(type: string) {
  const match = Object.entries(productTypeIconMap).find(([keyword]) =>
    type.includes(keyword),
  );
  return match ? match[1] : FileIcon;
}

function ProductCard({ product }: { product: ProductView }) {
  const TypeIcon = typeIcon(product.type);

  return (
    <Link
      href={product.href}
      className="group flex w-[80vw] shrink-0 snap-start flex-col gap-3 rounded-card border border-[#d9d9d9] px-[17px] py-[13px] transition-colors duration-200 hover:bg-surface md:w-auto md:shrink"
    >
      {/* أيقونة النوع واسمه أعلى يمين البطاقة، فوق صورة الغلاف */}
      <div className="flex items-center gap-1">
        <TypeIcon className="size-6 shrink-0 text-accent-blue" />
        <span className="text-h3 font-medium text-ink-muted">
          {product.type}
        </span>
      </div>

      {/* components.productCard — غلاف 226×174 بزوايا 9px */}
      <div className="relative aspect-[226/174] overflow-hidden rounded-media bg-surface-alt">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 80vw, 226px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <MediaPlaceholder label="غلاف المنتج" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 pt-[5px]">
        {/* العنوان في بداية السطر والسعر في نهايته */}
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-h3 text-ink-title">{product.title}</h3>
          <span className="shrink-0 text-h3 font-medium text-ink-price">
            <span dir="ltr" className="inline-block">
              {formatSitePrice(product.price)}
            </span>
          </span>
        </div>

        <span className="mt-auto inline-flex items-center gap-2 text-nano text-ink/80">
          {product.ctaLabel}
          <ArrowEndIcon className="size-[17px] text-accent-blue transition-transform duration-200 group-hover:-translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

/** emptyState: لو ما فيه منتجات، القسم كامل يُخفى */
export function Products({ products }: { products: ProductView[] }) {
  if (products.length === 0) return null;

  return (
    <Section id="products" className="py-[45px]" padded={false}>
      <SectionHeader
        icon={BagIcon}
        title={sections.products.title}
        link={sections.products.link}
      />

      <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Section>
  );
}
