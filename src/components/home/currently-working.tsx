import Link from "@/components/link";
import type { TaskView } from "@/lib/content";
import { sections } from "@/lib/fixed-content";
import { CheckIcon, ListIcon } from "@/components/icons";
import { Section, SectionHeader, cx } from "@/components/ui";

/** قسم اختياري — يُخفى بالكامل لو القائمة فاضية */
export function CurrentlyWorking({ tasks }: { tasks: TaskView[] }) {
  if (tasks.length === 0) return null;

  return (
    <Section id="currently-working" padded={false} className="py-[50px]">
      <SectionHeader icon={ListIcon} title={sections.currentlyWorking.title} />

      <ul className="flex flex-col gap-1.5">
        {tasks.map((task) => (
          <li key={task.id} className="flex flex-wrap items-center gap-2.5">
            <span
              className={cx(
                "flex size-[19px] shrink-0 items-center justify-center rounded-full border",
                task.completed
                  ? "border-success bg-success text-inverted"
                  : "border-line bg-page",
              )}
            >
              {task.completed ? <CheckIcon className="size-3" /> : null}
            </span>

            <span
              className={cx(
                "text-body",
                task.completed ? "text-ink-muted line-through" : "text-ink",
              )}
            >
              {task.text}
            </span>

            {task.tag ? (
              task.tagHref ? (
                <Link
                  href={task.tagHref}
                  className="rounded-tag bg-surface p-1 text-tag text-ink-muted transition-colors duration-200 hover:text-ink"
                >
                  {task.tag}
                </Link>
              ) : (
                <span className="rounded-tag bg-surface p-1 text-tag text-ink-muted">
                  {task.tag}
                </span>
              )
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}
