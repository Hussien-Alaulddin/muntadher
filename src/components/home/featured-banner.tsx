import Image from "next/image";
import Link from "@/components/link";
import type { BannerView } from "@/lib/content";
import { ArrowEndIcon, MegaphoneIcon } from "@/components/icons";
import { cx } from "@/components/ui";

/** بانر الرئيسية — شارة + وصف + عنوان + رابط، مع صورة اختيارية */
export function FeaturedBanner({ banner }: { banner: BannerView }) {
  if (!banner) return null;

  const ctaLabel = banner.ctaLabel?.trim() || (banner.href ? "المزيد" : null);
  const cta =
    banner.href && ctaLabel ? (
      <Link
        href={banner.href}
        className="group/cta mt-1 inline-flex items-center gap-2 text-sm font-medium text-ink transition-colors duration-200 hover:text-accent-blue"
      >
        <span>{ctaLabel}</span>
        <ArrowEndIcon className="size-4 text-accent-blue transition-transform duration-200 group-hover/cta:-translate-x-0.5" />
      </Link>
    ) : null;

  return (
    <section id="featured-banner" className="py-[45px]">
      <div className="container-site">
        <div
          className={cx(
            "grid items-center gap-6 rounded-card bg-surface p-5 md:gap-10 md:p-8 lg:p-10",
            banner.imageUrl
              ? "md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
              : "md:grid-cols-1",
          )}
        >
          {/* النص أولاً في DOM → يظهر يمين في RTL */}
          <div className="flex min-w-0 flex-col items-start gap-2.5 md:gap-3">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent-blue">
              <MegaphoneIcon className="size-4 shrink-0" />
              {banner.badgeLabel}
            </span>

            {banner.contentType ? (
              <p className="text-sm text-ink-muted">{banner.contentType}</p>
            ) : null}

            <h3 className="max-w-[22ch] text-[22px] leading-[1.35] font-bold tracking-[-0.02em] text-ink md:text-[28px] md:leading-[1.3]">
              {banner.title}
            </h3>

            {cta}
          </div>

          {banner.imageUrl ? (
            <div className="relative aspect-[16/11] w-full overflow-hidden rounded-[10px] bg-surface-alt md:aspect-[4/3]">
              <Image
                src={banner.imageUrl}
                alt={banner.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 42vw"
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
