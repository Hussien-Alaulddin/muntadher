import Image from "next/image";
import Link from "@/components/link";
import type { BookletDetailView, ProductView } from "@/lib/content";
import type { DemoBookletDetail, DemoBookletReview } from "@/lib/demo-booklet";
import { ArchiveProductCard } from "@/components/products/archive-product-card";
import { StarIcon, TrendingUpIcon } from "lucide-react";

export function BookletBreadcrumb({ title }: { title: string }) {
  return (
    <nav aria-label="مسار التنقل" className="text-micro text-ink-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="hover:text-ink">
            الرئيسية
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li>
          <Link href="/products" className="hover:text-ink">
            المنتجات
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li className="text-ink">{title}</li>
      </ol>
    </nav>
  );
}

export function BookletCover({ booklet }: { booklet: BookletDetailView }) {
  const src = booklet.coverImageUrl ?? booklet.imageUrl;
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-surface-alt md:min-h-[320px] md:aspect-[16/11]">
      {src ? (
        <Image
          src={src}
          alt={booklet.title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center bg-gradient-to-br from-surface via-surface-alt to-[#e8eef1] p-8">
          <div className="rounded-card border border-line bg-page px-8 py-10 text-center shadow-sm">
            <p className="text-micro text-ink-muted">{booklet.type}</p>
            <p className="mt-2 max-w-[240px] text-h3 text-ink-title">
              {booklet.title}
            </p>
            <p className="mt-3 text-sm font-medium text-success">
              {booklet.price}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** وصف المنتج بهيكل المرجع: مقدمة + نقاط + جمهور + تنويه */
export function BookletBody({ detail }: { detail: DemoBookletDetail }) {
  return (
    <section id="product-description" className="py-8 md:py-10">
      <h2 className="mb-5 text-h2">وصف المنتج</h2>
      <div className="max-w-[640px] space-y-5 text-lead text-ink">
        <p>{detail.bodyIntro}</p>

        <ul className="space-y-3">
          {detail.features.map((feature) => (
            <li key={feature.title} className="leading-[1.6]">
              <strong className="font-bold">{feature.title}:</strong>{" "}
              {feature.text}
            </li>
          ))}
        </ul>

        <div>
          <h3 className="mb-2 text-[15px] font-bold">{detail.audienceTitle}</h3>
          <ul className="list-disc space-y-1.5 pe-5">
            {detail.audience.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <p className="rounded-card bg-surface px-4 py-3 text-body text-ink-secondary">
          {detail.note}
        </p>
      </div>
    </section>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400" aria-label={`${rating} من 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon
          key={i}
          className={`size-3.5 ${i < rating ? "fill-current" : "text-ink-muted/30"}`}
        />
      ))}
    </span>
  );
}

export function BookletReviews({
  averageRating,
  reviewsCount,
  reviews,
}: {
  averageRating: number;
  reviewsCount: number;
  reviews: DemoBookletReview[];
}) {
  if (reviews.length === 0) return null;

  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    const pct =
      reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
    return { stars, pct, count };
  });

  return (
    <section id="reviews" className="py-8 md:py-10">
      <h2 className="mb-5 text-h2">التقييمات</h2>

      <div className="mb-8 flex flex-wrap items-end gap-8">
        <div>
          <p className="text-[48px] leading-none font-bold tracking-tight text-ink">
            {averageRating}
          </p>
          <div className="mt-2">
            <Stars rating={Math.round(averageRating)} />
          </div>
          <p className="mt-1 text-sm text-ink-secondary">
            ({reviewsCount} تقييم)
          </p>
        </div>

        <div className="min-w-[200px] flex-1 space-y-1.5">
          {distribution.map((row) => (
            <div key={row.stars} className="flex items-center gap-2 text-xs text-ink-muted">
              <span className="w-8">{row.stars}★</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-alt">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${row.pct}%` }}
                />
              </div>
              <span className="w-8 text-end">{row.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <h3 className="mb-4 text-[15px] font-bold text-ink">آراء العملاء</h3>
      <ul className="space-y-4">
        {reviews.map((review) => (
          <li
            key={`${review.name}-${review.dateLabel}`}
            className="rounded-card border border-line px-4 py-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-surface text-sm font-bold text-ink-muted">
                  {review.name.slice(0, 1)}
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{review.name}</p>
                  <p className="text-nano text-ink-muted">{review.dateLabel}</p>
                </div>
              </div>
              <Stars rating={review.rating} />
            </div>
            {review.comment ? (
              <p className="mt-3 text-body text-ink-secondary">{review.comment}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RelatedBooklets({ products }: { products: ProductView[] }) {
  if (products.length === 0) return null;

  return (
    <section id="related-products" className="py-8 pb-24 md:pb-12">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUpIcon className="size-5 text-accent-blue" />
        <h2 className="text-h2">منتجات أخرى قد تعجبك</h2>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
        {products.slice(0, 3).map((product) => (
          <ArchiveProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
