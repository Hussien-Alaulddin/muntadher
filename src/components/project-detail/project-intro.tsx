import type { ProjectDetailView } from "@/lib/content";
import { BrandMark } from "@/components/brand-mark";

export function ProjectIntro({
  project,
  brandMarkUrl,
}: {
  project: ProjectDetailView;
  brandMarkUrl?: string | null;
}) {
  return (
    <section id="project-intro" className="pt-[50px] md:pt-[70px]">
      <div className="container-site">
        {/* عمود المقدمة ~408px يمين كما في المرجع */}
        <div className="flex max-w-[408px] flex-col items-start gap-6 pb-12">
          <span className="inline-flex items-center gap-2 rounded-[24px] border border-ink/10 px-3 py-1">
            <BrandMark src={brandMarkUrl} />
            <span className="text-micro text-ink">{project.category}</span>
          </span>

          <h1 className="text-[32px] leading-[1.3] font-bold tracking-[-0.03em] md:text-[38px]">
            {project.title}
          </h1>

          {project.description ? (
            <p className="w-full text-justify text-lead text-ink">
              {project.description}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
