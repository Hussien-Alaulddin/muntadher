import Image from "next/image";
import Link from "@/components/link";
import type { ProjectView } from "@/lib/content";
import { ArrowUpLeftIcon } from "@/components/icons";
import { MediaPlaceholder } from "@/components/ui";

/** بطاقة مشروع مشتركة — الرئيسية وصفحة /projects */
export function ProjectCard({ project }: { project: ProjectView }) {
  const href = project.slug
    ? `/projects/${project.slug}`
    : project.href || "/projects";

  return (
    <Link
      href={href}
      className="group flex flex-col gap-5 overflow-hidden rounded-card"
    >
      {/* صورة غلاف ~253×217 بزوايا 9px مع تكبير طفيف عند المرور */}
      <div className="relative aspect-[253/217] overflow-hidden rounded-media bg-surface-alt">
        {project.imageUrl ? (
          <Image
            src={project.imageUrl}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 253px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <MediaPlaceholder label="صورة المشروع" />
        )}
      </div>

      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-[3px]">
          <h3 className="text-h3 text-ink-title">{project.title}</h3>
          <ArrowUpLeftIcon className="size-3.5 shrink-0 text-accent-blue transition-colors duration-200 group-hover:opacity-70" />
        </div>
        <span className="rounded-tag bg-surface p-1 text-tag text-ink-muted">
          {project.category}
        </span>
      </div>
    </Link>
  );
}
