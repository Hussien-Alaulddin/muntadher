import Image from "next/image";
import Link from "@/components/link";
import { hero } from "@/lib/fixed-content";
import type { SettingsView } from "@/lib/content";
import { HeroBadge } from "@/components/home/hero-badge";
import { projectRequestHref } from "@/lib/project-form";
import {
  MediaPlaceholder,
  cx,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";

function contactHref(settings: SettingsView) {
  if (settings.whatsappUrl) return settings.whatsappUrl;
  if (settings.contactEmail) return `mailto:${settings.contactEmail}`;
  return "#";
}

/** نقطة التوفر النابضة — حلقة خارجية + نقطة داخلية بنفس توقيت المرجع (1150ms) */
function AvailabilityDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex size-5 shrink-0 items-center justify-center">
      {active ? (
        <span className="animate-availability-ring absolute inset-0 rounded-full bg-success" />
      ) : null}
      <span
        className={cx(
          "relative size-3 rounded-full",
          active ? "animate-availability-dot bg-success" : "bg-ink-muted",
        )}
      />
    </span>
  );
}

export function Hero({ settings }: { settings: SettingsView }) {
  return (
    <section id="hero" className="py-[34px] md:py-[47px]">
      <div className="container-site grid items-center gap-8 md:grid-cols-[1fr_minmax(0,400px)] md:gap-[46px]">
        <div className="order-2 flex flex-col gap-5 md:order-1 md:gap-6 md:py-[66px]">
          <HeroBadge brandMarkUrl={settings.brandMarkUrl} />

          <h1 className="text-h1 tracking-[-0.03em]">{hero.heading}</h1>

          <p className="max-w-[338px] text-lead text-ink">{hero.paragraph}</p>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={contactHref(settings)} className={secondaryButtonClass}>
              {hero.ctaSecondary}
            </Link>
            <Link href={projectRequestHref()} className={primaryButtonClass}>
              {hero.ctaPrimary}
            </Link>
          </div>
        </div>

        <div
          className="relative order-1 w-full md:order-2"
          style={{ animationDelay: "90ms" }}
        >
          <div className="relative aspect-[400/374] overflow-hidden rounded-[8px] bg-surface-alt">
            {settings.heroImageUrl ? (
              <Image
                src={settings.heroImageUrl}
                alt={settings.designerName}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 400px"
                className="object-cover"
              />
            ) : (
              <MediaPlaceholder label="صورة المصمم" />
            )}
          </div>

          <span className="absolute bottom-[18px] end-[22px] inline-flex items-center gap-2 rounded-[8px] bg-glass px-5 py-3 backdrop-blur-[5px]">
            <AvailabilityDot active={settings.availableForWork} />
            <span className="text-small font-normal text-[#757575]">
              {hero.floatingBadge}
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
