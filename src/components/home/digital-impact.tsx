import Link from "@/components/link";
import type { DigitalImpactView } from "@/lib/content";
import { sections } from "@/lib/fixed-content";
import { CountUpValue } from "@/components/count-up";
import { GlobeIcon, PulseIcon, socialIconMap } from "@/components/icons";
import { platformIconKeys } from "@/lib/social-platforms";
import { Section, SectionHeader } from "@/components/ui";

function platformIcon(platform: string) {
  const trimmed = platform.trim();
  const key =
    platformIconKeys[trimmed.toLowerCase()] ?? platformIconKeys[trimmed];
  return key ? socialIconMap[key] : GlobeIcon;
}

function ImpactCard({ item }: { item: DigitalImpactView }) {
  const Icon = platformIcon(item.platform);

  const card = (
    <div className="flex h-full flex-col justify-between gap-5 rounded-card bg-surface px-[17px] pt-[17px] pb-[7px] transition-colors duration-200 hover:bg-surface-alt">
      {/* أيقونة المنصة ثم اسمها في بداية السطر */}
      <div className="flex items-center gap-1.5">
        <Icon className="size-[18px] shrink-0 text-accent-blue" />
        <span className="text-body text-ink-secondary">{item.platform}</span>
      </div>

      {/* الرقم في بداية السطر ونوع العد في نهايته */}
      <div className="flex items-baseline justify-between gap-2">
        <span dir="ltr" className="inline-block">
          <CountUpValue value={item.value} className="text-stat text-ink" />
        </span>
        <span className="text-body text-ink-secondary">{item.label}</span>
      </div>
    </div>
  );

  return item.url ? (
    <Link href={item.url} target="_blank" rel="noopener noreferrer">
      {card}
    </Link>
  ) : (
    card
  );
}

/** قسم اختياري — يظهر فقط لو ربط المصمم حساباً واحداً على الأقل */
export function DigitalImpact({ items }: { items: DigitalImpactView[] }) {
  if (items.length === 0) return null;

  return (
    <Section id="digital-impact" padded={false} className="py-[50px]">
      <SectionHeader icon={PulseIcon} title={sections.digitalImpact.title} />

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
        {items.map((item) => (
          <ImpactCard key={item.id} item={item} />
        ))}
      </div>
    </Section>
  );
}
