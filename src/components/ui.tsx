import Link from "@/components/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { ArrowEndIcon, ImageIcon } from "@/components/icons";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** زر ممتلئ رمادي 36px — مقاس المرجع: padding 6/14 و radius 9 */
export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-[9px] bg-surface px-3.5 py-1.5 text-small text-ink transition-colors duration-200 hover:bg-surface-alt";

/** زر بحدود رفيعة #EDEDED — padding 6/19 و radius 10 */
export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-field border border-[#ededed] px-[19px] py-1.5 text-small text-ink transition-colors duration-200 hover:bg-surface";

/** الزر البرتقالي الوحيد في المرجع (اشترك بالنشرة) */
export const accentButtonClass =
  "inline-flex items-center justify-center rounded-field bg-brand px-5 text-body font-medium text-inverted transition-colors duration-200 hover:bg-brand-hover";

/** رابط "تصفح الكل" — شريحة صغيرة padding 6/9 و radius 6 */
export const chipLinkClass =
  "group inline-flex items-center gap-1.5 rounded-chip px-[9px] py-1.5 text-small text-ink-muted transition-colors duration-200 hover:bg-surface hover:text-ink";

export function Section({
  id,
  children,
  className,
  surface = false,
  padded = true,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  surface?: boolean;
  padded?: boolean;
}) {
  return (
    <section
      id={id}
      className={cx(padded && "section-y", surface && "bg-surface", className)}
    >
      <div className="container-site">{children}</div>
    </section>
  );
}

/**
 * components.sectionHeader:
 * أيقونة 24px + عنوان القسم على اليمين، شريحة "تصفح الكل" على اليسار.
 */
export function SectionHeader({
  icon: Icon,
  title,
  link,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  link?: { label: string; href: string };
}) {
  return (
    <div className="mb-[18px] flex min-h-9 flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <Icon className="size-6 shrink-0 text-accent-blue" />
        <h2 className="text-h2">{title}</h2>
      </div>

      {link ? (
        <Link href={link.href} className={chipLinkClass}>
          {link.label}
          <ArrowEndIcon className="size-[19px] text-accent-blue transition-transform duration-200 group-hover:-translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}

/** بديل رمادي بنفس الأبعاد لحد ما يرفع المصمم صورته */
export function MediaPlaceholder({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cx(
        "flex size-full flex-col items-center justify-center gap-1.5 bg-surface-alt text-ink-muted",
        className,
      )}
    >
      <ImageIcon className="size-6" />
      {label ? <span className="text-tag">{label}</span> : null}
    </div>
  );
}

/** رسالة emptyState عامة — بدون دعوة لإضافة محتوى (الإضافة من لوحة الأدمن فقط) */
export function EmptyState({
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line bg-surface px-5 py-10 text-center">
      <h3 className="text-h3">{title}</h3>
      <p className="max-w-sm text-body text-ink-secondary">{body}</p>
      {ctaLabel && ctaHref ? (
        <Link href={ctaHref} className={cx(primaryButtonClass, "mt-1")}>
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
