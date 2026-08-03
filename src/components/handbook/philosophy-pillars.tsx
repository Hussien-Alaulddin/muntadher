import { handbookPage } from "@/lib/fixed-content";

export function PhilosophyPillars() {
  return (
    <section id="philosophy-pillars" className="pb-[64px] md:pb-[80px]">
      <div className="container-site flex flex-col gap-10 sm:flex-row sm:justify-between sm:gap-6">
        {handbookPage.pillars.map((pillar) => (
          <article
            key={pillar.number}
            className="flex w-full max-w-[300px] flex-col gap-[17px]"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex size-[18px] shrink-0 items-center justify-center bg-surface">
                <span className="text-[12px] leading-none text-ink-muted">
                  {pillar.number}
                </span>
              </span>
              <h3 className="text-[14px] leading-[1.3] font-medium text-ink">
                {pillar.title}
              </h3>
            </div>
            <p className="text-[14px] leading-[1.55] text-ink">
              {pillar.paragraphs.join(" ")}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
