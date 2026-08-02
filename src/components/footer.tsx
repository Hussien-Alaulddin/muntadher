import Link from "@/components/link";
import type { SettingsView, SocialView } from "@/lib/content";
import { copyrightLine } from "@/lib/fixed-content";
import { GlobeIcon, MailIcon, socialIconMap } from "@/components/icons";

function socialIcon(platform: string) {
  const key = platform.trim().toLowerCase() as keyof typeof socialIconMap;
  return socialIconMap[key] ?? GlobeIcon;
}

export function Footer({
  settings,
  socials,
}: {
  settings: SettingsView;
  socials: SocialView[];
}) {
  return (
    <footer className="pt-[45px] pb-14">
      <div className="container-site flex flex-col items-start gap-9">
        {settings.contactEmail ? (
          <Link
            href={`mailto:${settings.contactEmail}`}
            className="inline-flex items-center gap-2 text-small font-normal text-black/60 transition-colors duration-200 hover:text-ink"
          >
            <MailIcon className="size-[18px]" />
            {settings.contactEmail}
          </Link>
        ) : null}

        {socials.length > 0 ? (
          <ul className="flex items-center gap-4">
            {socials.map((social) => {
              const Icon = socialIcon(social.platform);

              return (
                <li key={social.id}>
                  <Link
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.platform}
                    className="flex items-center justify-center text-black/60 transition-colors duration-200 hover:text-ink"
                  >
                    <Icon className="size-[18px]" />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}

        <p className="text-micro leading-normal text-black/60">
          {copyrightLine(settings.designerName, settings.siteName)}
        </p>
      </div>
    </footer>
  );
}
