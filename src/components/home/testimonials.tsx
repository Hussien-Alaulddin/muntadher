import type { TestimonialView } from "@/lib/content";
import { sections } from "@/lib/fixed-content";
import { QuoteIcon } from "@/components/icons";
import { Section, SectionHeader, cx } from "@/components/ui";

/** قسم اختياري — يُخفى لو ما فيه شهادات مضافة بعد */
export function Testimonials({
  testimonials,
}: {
  testimonials: TestimonialView[];
}) {
  if (testimonials.length === 0) return null;

  return (
    <Section id="testimonials" padded={false} className="py-[45px]">
      <SectionHeader
        icon={QuoteIcon}
        title={sections.testimonials.title}
        link={sections.testimonials.link}
      />

      {/* ثلاثة أعمدة بارتفاعات متفاوتة كما في المرجع */}
      <div className="gap-2.5 md:columns-2 xl:columns-3">
        {testimonials.map((testimonial, index) => (
          <figure
            key={testimonial.id}
            className="mb-2.5 flex break-inside-avoid flex-col gap-3 rounded-card bg-surface p-[17px]"
          >
            {/* لون علامة الاقتباس يتبادل بين البرتقالي والأزرق */}
            <QuoteIcon
              className={cx(
                "size-5",
                index % 2 === 0 ? "text-brand" : "text-accent-blue",
              )}
            />

            <blockquote className="text-body text-ink-secondary">
              {testimonial.quote}
            </blockquote>

            <figcaption className="mt-auto flex flex-col gap-0.5">
              <div className="text-nano font-bold text-ink-muted">
                {testimonial.name}
              </div>
              <div className="text-nano font-normal text-ink-muted">
                {testimonial.title}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
