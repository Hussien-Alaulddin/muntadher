import { handbookPage } from "@/lib/fixed-content";
import { BookIcon } from "@/components/icons";

export function HandbookHero() {
  return (
    <section id="handbook-hero" className="pt-[50px] pb-[36px] md:pt-[70px] md:pb-[40px]">
      <div className="container-site flex flex-col items-start gap-6">
        <span className="inline-flex items-center gap-1 rounded-[24px] border border-ink/10 px-3 py-1">
          <BookIcon className="size-[22px] shrink-0 text-accent-blue" />
          <span className="text-micro text-ink">{handbookPage.badge}</span>
        </span>

        <h1 className="max-w-[280px] text-[32px] leading-[1.3] font-bold tracking-[-0.03em] md:max-w-none md:text-[38px]">
          {handbookPage.heading}
        </h1>

        <p className="max-w-[373px] text-justify text-lead text-ink">
          {handbookPage.paragraph}
        </p>
      </div>
    </section>
  );
}
