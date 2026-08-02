import type { StatView } from "@/lib/content";
import { CountUpValue } from "@/components/count-up";

/**
 * كروت العدادات — مطابقة للمرجع قياساً:
 * ~192.5×98، bg #f7f7f7، radius 12، padding 17/17/7، gap 9،
 * تسمية 14/18.2 بلون 60%، رقم 34 Regular بنفس اللون، و + بلون أفتح.
 */
export function Stats({ stats }: { stats: StatView[] }) {
  return (
    <section id="stats" className="pt-2.5 pb-[60px] md:pb-20">
      <div className="container-site grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.slug}
            className="flex h-[98px] flex-col justify-center overflow-hidden rounded-[12px] bg-[#f7f7f7] px-[17px] pt-[17px] pb-[7px]"
          >
            <div className="flex flex-col gap-[9px]">
              <span className="text-[14px] leading-[18.2px] tracking-[-0.02em] text-ink-secondary">
                {stat.label}
              </span>
              <CountUpValue
                value={stat.value || "—"}
                variant="stat"
                className="text-[34px] leading-none font-normal text-ink-secondary"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
