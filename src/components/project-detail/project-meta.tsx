import type { ProjectMetaItem } from "@/lib/content";

export function ProjectMeta({ items }: { items: ProjectMetaItem[] }) {
  if (items.length === 0) return null;

  return (
    <section id="project-meta" className="pb-8 md:pb-10">
      <div className="container-site grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {items.map((item) => (
          <article
            key={`${item.label}-${item.value}`}
            className="flex min-h-[82px] flex-col justify-center rounded-card bg-surface px-[17px] pt-[17px] pb-[14px]"
          >
            <span className="text-[14px] leading-[1.3] text-ink-secondary">
              {item.label}
            </span>
            <span className="text-[20px] leading-[1.3] text-ink-secondary">
              {item.value}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
