import { handbookPage } from "@/lib/fixed-content";
import { LayersIcon } from "@/components/icons";

/** يعرض نصاً مع دعم **غامق** بسيط */
function RichParagraph({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className="max-w-[560px] text-justify text-lead text-ink">
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-bold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </p>
  );
}

export function HandbookHero() {
  return (
    <section
      id="handbook-hero"
      className="pt-[50px] pb-[64px] md:pt-[70px] md:pb-[80px]"
    >
      <div className="container-site flex flex-col items-start gap-6">
        <span className="inline-flex items-center gap-1 rounded-[24px] border border-ink/10 px-3 py-1">
          <LayersIcon className="size-[22px] shrink-0 text-accent-blue" />
          <span className="text-micro text-ink">{handbookPage.badge}</span>
        </span>

        <h1 className="max-w-[280px] text-[32px] leading-[1.3] font-bold tracking-[-0.03em] md:max-w-none md:text-[38px]">
          {handbookPage.heading}
        </h1>

        <RichParagraph text={handbookPage.paragraphs.join(" ")} />
      </div>
    </section>
  );
}
