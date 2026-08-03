import { projectsPage } from "@/lib/fixed-content";
import { BrandMark } from "@/components/brand-mark";
import { projectRequestHref } from "@/lib/project-form";
import Link from "@/components/link";
import { primaryButtonClass } from "@/components/ui";

export function ProjectsHero({
  brandMarkUrl,
}: {
  brandMarkUrl?: string | null;
}) {
  return (
    <section id="projects-hero" className="pt-[50px] pb-[40px] md:pt-[70px] md:pb-[50px]">
      <div className="container-site flex flex-col items-start gap-5 md:gap-6">
        <span className="inline-flex items-center gap-2 self-start rounded-[24px] border border-ink/10 px-3 py-1">
          <BrandMark src={brandMarkUrl} />
          <span className="text-micro text-ink">{projectsPage.badge}</span>
        </span>

        <h1 className="max-w-[280px] text-[32px] leading-[1.3] font-bold tracking-[-0.03em] md:max-w-[320px] md:text-[38px] md:leading-[1.3]">
          {projectsPage.heading}
        </h1>

        <p className="max-w-[338px] text-lead text-ink">{projectsPage.subtext}</p>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href={projectRequestHref()} className={primaryButtonClass}>
            {projectsPage.ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
