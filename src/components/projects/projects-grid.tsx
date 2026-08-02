import type { ProjectView } from "@/lib/content";
import { projectsPage } from "@/lib/fixed-content";
import { ProjectCard } from "@/components/project-card";
import { EmptyState } from "@/components/ui";

export function ProjectsGrid({ projects }: { projects: ProjectView[] }) {
  return (
    <section id="projects-grid" className="pb-[50px] md:pb-[70px]">
      <div className="container-site">
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 md:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={projectsPage.emptyTitle}
            body={projectsPage.emptyBody}
          />
        )}
      </div>
    </section>
  );
}
