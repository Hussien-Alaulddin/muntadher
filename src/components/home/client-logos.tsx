import Image from "next/image";
import type { ClientLogoView } from "@/lib/content";

function LogoItem({ logo }: { logo: ClientLogoView }) {
  return (
    <li className="flex h-[63px] shrink-0 items-center justify-center">
      {logo.logoUrl ? (
        <Image
          src={logo.logoUrl}
          alt={logo.name}
          width={160}
          height={63}
          className="h-full w-auto max-w-none object-contain"
        />
      ) : (
        <span className="text-body text-ink-muted">{logo.name}</span>
      )}
    </li>
  );
}

/** قسم اختياري — يُخفى تماماً لو ما فيه شعارات مضافة */
export function ClientLogos({ logos }: { logos: ClientLogoView[] }) {
  if (logos.length === 0) return null;

  return (
    <section id="clients-logos" className="py-[40px] md:py-[55px]">
      <div className="container-site">
        {/* شريط يتحرك تلقائياً كما في المرجع — نسخة مكرّرة تضمن استمرارية الحركة */}
        <div className="overflow-hidden">
          <ul className="animate-logo-marquee flex w-max items-center gap-10">
            {logos.map((logo) => (
              <LogoItem key={logo.id} logo={logo} />
            ))}
            {logos.map((logo) => (
              <LogoItem key={`${logo.id}-clone`} logo={logo} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
