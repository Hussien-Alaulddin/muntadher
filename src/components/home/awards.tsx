import Image from "next/image";
import type { AwardView } from "@/lib/content";
import { sections } from "@/lib/fixed-content";
import { TrophyIcon } from "@/components/icons";
import { MediaPlaceholder, Section, SectionHeader } from "@/components/ui";

function AwardCard({ award }: { award: AwardView }) {
  return (
    <article className="flex w-[70vw] shrink-0 snap-start flex-col gap-5 md:w-[250px]">
      {/* components.awardCard — صورة مربّعة 250×250 بزوايا 9px */}
      <div className="relative aspect-square overflow-hidden rounded-media bg-surface-alt">
        {award.imageUrl ? (
          <Image
            src={award.imageUrl}
            alt={award.title}
            fill
            sizes="(max-width: 640px) 70vw, 250px"
            className="object-cover"
          />
        ) : (
          <MediaPlaceholder label="صورة الجائزة" />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-tag text-ink-muted">{award.org}</span>
        <h3 className="text-h3 text-ink-title">{award.title}</h3>
        <p className="line-clamp-2 text-body text-ink-secondary">
          {award.description}
        </p>
      </div>
    </article>
  );
}

/** emptyState: لو ما عنده جوائز، القسم كامل يُخفى */
export function Awards({ awards }: { awards: AwardView[] }) {
  if (awards.length === 0) return null;

  return (
    <Section id="awards" padded={false} className="py-[50px]">
      <SectionHeader icon={TrophyIcon} title={sections.awards.title} />

      {/* صف أفقي قابل للسحب — البطاقات تتجاوز عرض العمود كما في المرجع */}
      <div className="no-scrollbar -mx-5 flex snap-x gap-6 overflow-x-auto px-5 md:mx-0 md:px-0">
        {awards.map((award) => (
          <AwardCard key={award.id} award={award} />
        ))}
      </div>
    </Section>
  );
}
