import type { HighlightView } from "@/lib/content";
import { sections } from "@/lib/fixed-content";
import { RouteIcon, SparkIcon } from "@/components/icons";
import { Section, SectionHeader } from "@/components/ui";

/** قسم اختياري — يُخفى لو ما عبّى المصمم أي محطة */
export function CareerHighlights({
  highlights,
}: {
  highlights: HighlightView[];
}) {
  if (highlights.length === 0) return null;

  return (
    <Section id="career-highlights" padded={false} className="py-[50px]">
      <SectionHeader icon={RouteIcon} title={sections.careerHighlights.title} />

      <ul className="flex flex-col gap-1.5">
        {highlights.map((highlight) => (
          <li key={highlight.id} className="flex items-start gap-2.5">
            <SparkIcon className="mt-0.5 size-[19px] shrink-0 text-accent-blue" />
            <span className="text-body">{highlight.text}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
