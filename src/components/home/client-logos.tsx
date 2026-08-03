import Image from "next/image";
import type { ClientLogoView } from "@/lib/content";

function LogoItem({ logo }: { logo: ClientLogoView }) {
  return (
    <li className="me-10 flex h-[63px] shrink-0 items-center justify-center">
      {logo.logoUrl ? (
        <Image
          src={logo.logoUrl}
          alt={logo.name}
          width={160}
          height={63}
          className="h-full w-auto max-w-none object-contain"
        />
      ) : (
        <span className="text-body whitespace-nowrap text-ink-muted">
          {logo.name}
        </span>
      )}
    </li>
  );
}

/** يكرّر القائمة حتى يكفي عرض الشريط بدون فراغ ظاهر */
function expandLogos(logos: ClientLogoView[], minItems: number) {
  if (logos.length === 0) return [];
  const out: ClientLogoView[] = [];
  while (out.length < minItems) {
    out.push(...logos);
  }
  return out;
}

/** قسم اختياري — يُخفى تماماً لو ما فيه شعارات مضافة */
export function ClientLogos({ logos }: { logos: ClientLogoView[] }) {
  if (logos.length === 0) return null;

  // مجموعة واحدة عريضة بما يكفي، ثم نكرّرها مرتين للحركة اللانهائية بلا قفزة
  const set = expandLogos(logos, Math.max(8, logos.length * 2));

  return (
    <section id="clients-logos" className="py-[40px] md:py-[55px]">
      <div className="container-site">
        <div className="overflow-hidden">
          <ul className="animate-logo-marquee flex w-max items-center">
            {set.map((logo, index) => (
              <LogoItem key={`${logo.id}-a-${index}`} logo={logo} />
            ))}
            {/* نسخة مطابقة — عند الوصول لـ 50% تعود الحلقة بلا فراغ */}
            {set.map((logo, index) => (
              <LogoItem key={`${logo.id}-b-${index}`} logo={logo} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
