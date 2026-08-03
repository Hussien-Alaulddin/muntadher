import Image from "next/image";
import { StarBadgeIcon } from "@/components/icons";
import { cx } from "@/components/ui";

/**
 * علامة العلامة التجارية المصغّرة:
 * اللوكو المرفوع من الإعدادات، أو نجمة افتراضية إن لم يُرفع.
 */
export function BrandMark({
  src,
  className,
  alt = "",
}: {
  src?: string | null;
  className?: string;
  alt?: string;
}) {
  const mark = src?.trim();
  if (mark) {
    return (
      <span
        className={cx(
          "relative inline-block size-3.5 shrink-0 overflow-hidden",
          className,
        )}
      >
        <Image src={mark} alt={alt} fill sizes="14px" className="object-contain" />
      </span>
    );
  }

  return (
    <StarBadgeIcon
      className={cx("size-3.5 shrink-0 text-accent-blue", className)}
    />
  );
}
