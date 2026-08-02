import Link from "@/components/link";
import type { BannerView } from "@/lib/content";
import { sections } from "@/lib/fixed-content";
import { ArrowEndIcon } from "@/components/icons";

/** قسم اختياري بالكامل — لا يظهر إلا لو فعّله المصمم من لوحة التحكم */
export function FeaturedBanner({ banner }: { banner: BannerView }) {
  if (!banner) return null;

  const content = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card bg-surface p-5 transition-colors duration-200 hover:bg-surface-alt">
      <span className="rounded-pill bg-brand px-2.5 py-0.5 text-nano text-inverted">
        {sections.featuredBanner.tag}
      </span>

      <h3 className="text-h3 text-ink-title">{banner.title}</h3>

      {banner.contentType ? (
        <span className="text-body text-ink-muted">{banner.contentType}</span>
      ) : null}

      {banner.href ? (
        <ArrowEndIcon className="ms-auto size-[19px] text-accent-blue" />
      ) : null}
    </div>
  );

  return (
    <section id="featured-banner" className="py-[45px]">
      <div className="container-site">
        {banner.href ? (
          <Link href={banner.href} className="group block">
            {content}
          </Link>
        ) : (
          content
        )}
      </div>
    </section>
  );
}
