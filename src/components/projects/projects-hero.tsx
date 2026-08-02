import Link from "@/components/link";
import type { SettingsView } from "@/lib/content";
import { projectsPage } from "@/lib/fixed-content";
import { projectRequestHref } from "@/lib/project-form";
import { BehanceIcon, StarBadgeIcon } from "@/components/icons";
import { primaryButtonClass } from "@/components/ui";

export function ProjectsHero({ settings }: { settings: SettingsView }) {
  return (
    <section id="projects-hero" className="pt-[50px] pb-[40px] md:pt-[70px] md:pb-[50px]">
      <div className="container-site flex flex-col items-start gap-5 md:gap-6">
        <span className="inline-flex items-center gap-2 self-start rounded-[24px] border border-ink/10 px-3 py-1">
          <StarBadgeIcon className="size-3.5 shrink-0 text-accent-blue" />
          <span className="text-micro text-ink">{projectsPage.badge}</span>
        </span>

        <h1 className="max-w-[280px] text-[32px] leading-[1.3] font-bold tracking-[-0.03em] md:max-w-[320px] md:text-[38px] md:leading-[1.3]">
          {projectsPage.heading}
        </h1>

        <p className="max-w-[338px] text-lead text-ink">{projectsPage.subtext}</p>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={projectRequestHref(settings.projectRequestFormUrl)}
            className={primaryButtonClass}
          >
            {projectsPage.ctaLabel}
          </Link>

          {/* رابط بورتفوليو خارجي اختياري — يظهر فقط لو فعّله المصمم من الإعدادات */}
          {settings.externalPortfolioUrl ? (
            <Link
              href={settings.externalPortfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="بورتفوليو خارجي"
              className="flex size-[30px] items-center justify-center rounded-[8px] bg-surface text-ink transition-colors duration-200 hover:bg-surface-alt"
            >
              <BehanceIcon className="size-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
