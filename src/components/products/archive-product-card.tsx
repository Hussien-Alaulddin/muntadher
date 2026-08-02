import Image from "next/image";
import Link from "@/components/link";
import type { ProductView } from "@/lib/content";
import {
  ArrowEndIcon,
  FileIcon,
  productTypeIconMap,
} from "@/components/icons";
import { MediaPlaceholder } from "@/components/ui";

function typeIcon(type: string) {
  const match = Object.entries(productTypeIconMap).find(([keyword]) =>
    type.includes(keyword),
  );
  return match ? match[1] : FileIcon;
}

/** بطاقة أرشيف /products — غلاف بعرض البطاقة وارتفاع 174px كما في المرجع */
export function ArchiveProductCard({ product }: { product: ProductView }) {
  const TypeIcon = typeIcon(product.type);

  return (
    <Link
      href={product.href}
      className="group flex flex-col gap-3 rounded-card border border-[#d9d9d9] px-[17px] py-[13px] transition-colors duration-200 hover:bg-surface"
    >
      <div className="flex items-center gap-1">
        <TypeIcon className="size-6 shrink-0 text-ink-muted" />
        <span className="text-h3 font-medium text-ink-muted">{product.type}</span>
      </div>

      <div className="relative h-[174px] w-full overflow-hidden rounded-media bg-surface-alt">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <MediaPlaceholder label="غلاف المنتج" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 pt-[5px]">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-h3 text-ink-title">{product.title}</h3>
          <span className="shrink-0 text-h3 font-medium text-ink-price">
            <span dir="ltr" className="inline-block">
              {product.price}
            </span>
          </span>
        </div>

        {product.description ? (
          <p className="text-nano text-ink/80">{product.description}</p>
        ) : null}

        <span className="mt-auto inline-flex items-center gap-2 pt-1 text-nano text-ink/80">
          {product.ctaLabel}
          <ArrowEndIcon className="size-[17px] transition-transform duration-200 group-hover:-translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
