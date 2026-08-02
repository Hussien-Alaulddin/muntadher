import { notFound } from "next/navigation";
import {
  getProjectDetailPageContent,
  getPublishedProjectSlugs,
} from "@/lib/content";
import { ProjectIntro } from "@/components/project-detail/project-intro";
import { ProjectMeta } from "@/components/project-detail/project-meta";
import { ProjectCaseStudyStack } from "@/components/project-detail/project-media";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getPublishedProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = await getProjectDetailPageContent(slug);
  if (!content) return { title: "مشروع غير موجود" };

  return {
    title: content.project.title,
    description: content.project.description?.slice(0, 160) ?? undefined,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = await getProjectDetailPageContent(slug);
  if (!content) notFound();

  const { project } = content;

  return (
    <main>
      <ProjectIntro project={project} />
      <ProjectMeta items={project.meta} />
      <ProjectCaseStudyStack
        title={project.title}
        logoImageUrl={project.logoImageUrl}
        coverImageUrl={project.coverImageUrl}
        brandGallery={project.brandGallery}
        applicationGallery={project.applicationGallery}
      />
      <div className="pb-[45px] md:pb-[55px]" />
    </main>
  );
}
