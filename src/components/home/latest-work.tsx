import type { ProjectView } from "@/lib/content";
import { sections } from "@/lib/fixed-content";
import { ProjectCard } from "@/components/project-card";
import { FolderIcon } from "@/components/icons";
import { EmptyState, Section, SectionHeader } from "@/components/ui";

export function LatestWork({ projects }: { projects: ProjectView[] }) {
  return (
    <Section id="latest-work" padded={false}>
      <SectionHeader
        icon={FolderIcon}
        title={sections.latestWork.title}
        link={sections.latestWork.link}
      />

      {projects.length > 0 ? (
        <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
          {projects.map((project) => (
            <div
              key={project.id}
              className="w-[78vw] shrink-0 snap-start md:w-auto md:shrink"
            >
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={sections.latestWork.emptyTitle}
          body={sections.latestWork.emptyBody}
        />
      )}
    </Section>
  );
}
