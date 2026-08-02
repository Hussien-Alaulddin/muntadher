import type { ComponentType, SVGProps } from "react";
import { handbookPage } from "@/lib/fixed-content";
import {
  BrushIcon,
  EyeIcon,
  FlagIcon,
  FrameIcon,
  MapIcon,
  SearchIcon,
  SmileIcon,
} from "@/components/icons";

const stepIcons: Record<
  (typeof handbookPage.steps)[number]["icon"],
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  search: SearchIcon,
  map: MapIcon,
  eye: EyeIcon,
  brush: BrushIcon,
  frame: FrameIcon,
  flag: FlagIcon,
};

export function ProcessSteps() {
  return (
    <section id="process-steps" className="pb-[45px] md:pb-[55px]">
      <div className="container-site">
        <div className="mb-6 flex flex-col items-start gap-4 md:mb-8">
          <div className="flex w-full items-center gap-2">
            <SmileIcon className="size-6 shrink-0 text-accent-blue" />
            <h2 className="text-h2">{handbookPage.processHeading}</h2>
          </div>
          <p className="max-w-[376px] text-justify text-lead text-ink">
            {handbookPage.processParagraph}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {handbookPage.steps.map((step) => {
            const Icon = stepIcons[step.icon];

            return (
              <article
                key={step.number}
                className="flex flex-col gap-4 rounded-card bg-surface p-[17px] transition-colors duration-200 hover:bg-surface-alt"
              >
                {/* العنوان يمين والأيقونة يسار — كما في المرجع */}
                <div className="flex items-center gap-2.5">
                  <span className="flex-1 text-[17px] leading-[1.3] font-medium text-ink-title">
                    <span>{step.number}</span>
                    <span className="mx-1.5">|</span>
                    {step.title}
                  </span>
                  <Icon className="size-6 shrink-0 text-accent-blue" />
                </div>
                <p className="text-[14px] leading-[1.3] font-medium text-ink-muted">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
