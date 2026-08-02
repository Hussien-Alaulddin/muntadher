"use client";

import { useState } from "react";
import type { FaqView } from "@/lib/content";
import { sections } from "@/lib/fixed-content";
import { ChevronDownIcon, HelpIcon } from "@/components/icons";
import { Section, SectionHeader, cx } from "@/components/ui";

/** قسم اختياري — يُخفى لو ما فيه أسئلة مضافة بعد */
export function Faq({ faqs }: { faqs: FaqView[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (faqs.length === 0) return null;

  return (
    <Section id="faq" padded={false} className="pt-[45px] pb-[65px]">
      <SectionHeader icon={HelpIcon} title={sections.faq.title} />

      <div className="flex flex-col gap-2.5">
        {faqs.map((faq, index) => {
          const open = openId === faq.id;

          return (
            <div
              key={faq.id}
              className={cx(
                "rounded-faq py-[13px] pe-6 ps-[14px] transition-colors duration-200",
                open ? "bg-surface" : "bg-page hover:bg-surface",
              )}
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : faq.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-2 text-right"
              >
                <span className="text-[20px] leading-8 font-bold text-accent-blue">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="flex-1 text-question text-ink-faq">
                  {faq.question}
                </span>

                <ChevronDownIcon
                  className={cx(
                    "size-[19px] shrink-0 text-ink-muted transition-transform duration-300",
                    open && "rotate-180",
                  )}
                />
              </button>

              {/* فتح/إغلاق ناعم */}
              <div
                className={cx(
                  "overflow-hidden transition-[max-height,opacity] duration-300 ease-out",
                  open ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                )}
              >
                <p className="pt-2.5 pe-[19px] text-body text-ink-secondary">
                  {faq.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
