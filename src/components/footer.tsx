import {
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TelegramIcon,
  WhatsappIcon,
} from "@/components/icons";
import { cx } from "@/components/ui";
import type { ComponentType, SVGProps } from "react";
import { navbar } from "@/lib/fixed-content";
import type { SettingsView, SocialView } from "@/lib/content";
import Link from "@/components/link";
import Image from "next/image";

const ALPHA_TECH_URL = "https://wa.me/9647716119977";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const footerSocials: {
  key: "instagramUrl" | "whatsappUrl" | "facebookUrl" | "telegramUrl";
  label: string;
  Icon: IconComponent;
}[] = [
  { key: "instagramUrl", label: "انستجرام", Icon: InstagramIcon },
  { key: "whatsappUrl", label: "واتساب", Icon: WhatsappIcon },
  { key: "facebookUrl", label: "فيسبوك", Icon: FacebookIcon },
  { key: "telegramUrl", label: "تلجرام", Icon: TelegramIcon },
];

const socialIconClass =
  "flex size-9 items-center justify-center rounded-full bg-page/90 text-black ring-1 ring-line transition-colors duration-200 hover:text-brand";

const contactIconClass =
  "flex size-8 shrink-0 items-center justify-center rounded-full bg-page text-black ring-1 ring-line transition-colors duration-200 group-hover:text-brand";

function phoneHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : undefined;
}

export function Footer({
  settings,
}: {
  settings: SettingsView;
  /** مُبقى للتوافق مع الاستدعاءات الحالية — أيقونات الفوتر من الإعدادات */
  socials?: SocialView[];
}) {
  const description =
    settings.footerDescription?.trim() ||
    "شريكك الاستراتيجي لهُويّة علامتك التجاريّة — نحوّل العلامة إلى قصة، والقصة إلى هُويّة بصريّة.";

  const brandName = settings.siteName || settings.designerName;
  const email = settings.contactEmail?.trim() || "";
  const phone = settings.contactPhone?.trim() || "";
  const location = settings.contactLocation?.trim() || "";
  const hasContact = Boolean(email || phone || location);
  const tel = phone ? phoneHref(phone) : undefined;

  return (
    <footer className="relative mt-12 overflow-hidden border-t border-line">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_100%_0%,rgba(255,102,20,0.1),transparent_52%),linear-gradient(180deg,#fafafa_0%,#f1f1f1_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-brand to-transparent opacity-80"
      />

      <div className="relative container-site py-12 md:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_auto_auto] lg:items-start lg:gap-14">
          {/* الهوية */}
          <div className="flex max-w-[420px] flex-col gap-3.5 sm:col-span-2 lg:col-span-1">
            {settings.footerLogoUrl ? (
              <Link
                href="/"
                aria-label={brandName}
                className="inline-block w-fit transition-opacity duration-200 hover:opacity-80"
              >
                <Image
                  src={settings.footerLogoUrl}
                  alt={brandName}
                  width={420}
                  height={120}
                  className="h-12 w-auto max-w-[300px] object-contain object-right md:h-14 md:max-w-[360px]"
                />
              </Link>
            ) : (
              <Link
                href="/"
                className="w-fit text-[28px] leading-none font-bold tracking-[-0.04em] text-ink transition-opacity duration-200 hover:opacity-70"
              >
                {brandName}
              </Link>
            )}
            <p className="text-lead text-ink-secondary">{description}</p>

            <ul className="flex flex-wrap gap-2 pt-1">
              {footerSocials.map(({ key, label, Icon }) => {
                const url = settings[key]?.trim() || "";
                if (url) {
                  return (
                    <li key={key}>
                      <Link
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className={socialIconClass}
                      >
                        <Icon className="size-4" />
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={key}>
                    <span
                      aria-label={`${label} — قريباً`}
                      title="أضف الرابط من الإعدادات"
                      className={cx(socialIconClass, "cursor-pointer text-black/75")}
                    >
                      <Icon className="size-4" />
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* روابط */}
          <nav aria-label="روابط سريعة" className="lg:pt-1">
            <p className="mb-3.5 text-body font-bold text-ink-muted">روابط سريعة</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2.5 lg:flex-col lg:gap-2.5">
              {navbar.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body font-medium text-ink transition-colors duration-200 hover:text-brand"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* معلومات التواصل */}
          {hasContact ? (
            <div className="lg:pt-1">
              <p className="mb-3.5 text-body font-bold text-ink-muted">معلومات التواصل</p>
              <ul className="flex flex-col gap-3">
                {email ? (
                  <li>
                    <Link
                      href={`mailto:${email}`}
                      className="group inline-flex items-center gap-2.5 text-body text-ink"
                    >
                      <span className={contactIconClass}>
                        <MailIcon className="size-[15px]" />
                      </span>
                      <span dir="ltr" className="break-all">
                        {email}
                      </span>
                    </Link>
                  </li>
                ) : null}
                {phone ? (
                  <li>
                    {tel ? (
                      <Link
                        href={tel}
                        className="group inline-flex items-center gap-2.5 text-body text-ink"
                      >
                        <span className={contactIconClass}>
                          <PhoneIcon className="size-[15px]" />
                        </span>
                        <span dir="ltr">{phone}</span>
                      </Link>
                    ) : (
                      <span className="group inline-flex items-center gap-2.5 text-body text-ink">
                        <span className={contactIconClass}>
                          <PhoneIcon className="size-[15px]" />
                        </span>
                        <span dir="ltr">{phone}</span>
                      </span>
                    )}
                  </li>
                ) : null}
                {location ? (
                  <li>
                    <span className="group inline-flex items-center gap-2.5 text-body text-ink">
                      <span className={contactIconClass}>
                        <MapPinIcon className="size-[15px]" />
                      </span>
                      <span>{location}</span>
                    </span>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-1.5 border-t border-line/80 pt-6 text-center sm:flex-row sm:gap-3">
          <Link
            href={ALPHA_TECH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-small font-medium text-ink transition-colors duration-200 hover:text-brand"
          >
            تم تطوير الموقع بواسطة شركة Alpha Tech
          </Link>
          <span
            aria-hidden
            className="hidden size-1 rounded-full bg-ink-muted/50 sm:block"
          />
          <p className="text-small text-ink-secondary">
            جميع الحقوق محفوظة © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
