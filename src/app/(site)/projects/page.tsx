import { getProjectsPageContent } from "@/lib/content";
import { ProjectsHero } from "@/components/projects/projects-hero";
import { ProjectsGrid } from "@/components/projects/projects-grid";

export const revalidate = 60;

export default async function ProjectsPage() {
  const content = await getProjectsPageContent();

  return (
    <main>
      <ProjectsHero brandMarkUrl={content.settings.brandMarkUrl} />
      <ProjectsGrid projects={content.projects} />
    </main>
  );
}
