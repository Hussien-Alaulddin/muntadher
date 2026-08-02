import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

/** سهم يشير لجهة نهاية السطر في RTL (يسار) — يُستخدم بروابط "تصفح الكل" */
export function ArrowEndIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

/** سهم خارجي — بطاقات المشاريع */
export function ArrowUpLeftIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M17 17 7 7" />
      <path d="M7 17V7h10" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** نجمة الشارة في الهيرو — نفس مسار الأيقونة بالموقع المرجعي */
export function StarBadgeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 14 14" fill="currentColor" {...props}>
      <path d="M 7 0 L 8.459 3.148 L 11.569 1.689 L 10.693 5.052 L 14 5.964 L 11.2 7.97 L 13.156 10.826 L 9.741 10.535 L 9.431 14 L 7 11.548 L 4.569 14 L 4.259 10.535 L 0.844 10.826 L 2.8 7.97 L 0 5.964 L 3.307 5.052 L 2.431 1.689 L 5.541 3.148 Z" />
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M12 8.5 13.2 11l2.3 1-2.3 1L12 15.5 10.8 13l-2.3-1 2.3-1z" />
    </svg>
  );
}

export function FolderIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h7A1.5 1.5 0 0 1 19 10v7.5A1.5 1.5 0 0 1 17.5 19h-13A1.5 1.5 0 0 1 3 17.5z" />
    </svg>
  );
}

export function BagIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8h16l-1 11a1.5 1.5 0 0 1-1.5 1.4h-11A1.5 1.5 0 0 1 5 19z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 4h8v4a4 4 0 0 1-8 0z" />
      <path d="M8 5H5.5A1.5 1.5 0 0 0 4 6.5C4 9 6 10 8 10M16 5h2.5A1.5 1.5 0 0 1 20 6.5C20 9 18 10 16 10" />
      <path d="M12 12v4M9 20h6M10.5 20l.5-4h2l.5 4" />
    </svg>
  );
}

export function PulseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 12h4l2.5-6 3 12 2.5-6H21" />
    </svg>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}

export function RouteIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <path d="M15.5 6H10a4 4 0 0 0 0 8h4a4 4 0 0 1 0 8h-.5" />
    </svg>
  );
}

export function QuoteIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M9.4 5.6c-3 1.5-4.8 4.2-4.8 7.6 0 3.3 1.9 5.2 4.3 5.2 2.1 0 3.6-1.5 3.6-3.5 0-1.9-1.3-3.3-3.1-3.3-.4 0-.7 0-1 .2.4-1.6 1.6-3 3.3-3.9zm9.1 0c-3 1.5-4.8 4.2-4.8 7.6 0 3.3 1.9 5.2 4.3 5.2 2.1 0 3.6-1.5 3.6-3.5 0-1.9-1.3-3.3-3.1-3.3-.4 0-.7 0-1 .2.4-1.6 1.6-3 3.3-3.9z" />
    </svg>
  );
}

export function HelpIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.3M12 16.5h.01" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={2.2} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  );
}

/** كتاب مفتوح — بادج Handbook */
export function BookIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v15H6.5A2.5 2.5 0 0 1 4 14.5v-10A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

/** وجه مبتسم بزوايا دائرية — عنوان آلية العمل */
export function SmileIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <circle cx="9" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

/** خريطة مطوية — خطوة الاستراتيجية */
export function MapIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
      <path d="M9 3v15M15 6v15" />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** فرشاة رسم — خطوة الشعار والخط */
export function BrushIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m9.5 16.5-2.2 2.2a2.1 2.1 0 0 1-3-3L6.5 13.5" />
      <path d="M14 4.5 19.5 10" />
      <path d="M14 4.5 6.5 12a2.5 2.5 0 0 0-.6 1.2l-.6 2.9 2.9-.6a2.5 2.5 0 0 0 1.2-.6L17.5 8" />
    </svg>
  );
}

/** زوايا إطار — خطوة نقاط الاتصال */
export function FrameIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 9V5a1 1 0 0 1 1-1h4" />
      <path d="M15 4h4a1 1 0 0 1 1 1v4" />
      <path d="M20 15v4a1 1 0 0 1-1 1h-4" />
      <path d="M9 20H5a1 1 0 0 1-1-1v-4" />
    </svg>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 22V4" />
      <path d="M4 4s2-1.5 6 0 6 0 6 0v9s-2 1.5-6 0-6 0-6 0z" />
    </svg>
  );
}

export function VideoIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="6" width="12.5" height="12" rx="2.5" />
      <path d="m15.5 12 5.5-3.5v7z" />
    </svg>
  );
}

export function FileIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 3.5H7.5A1.5 1.5 0 0 0 6 5v14a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19V7.5z" />
      <path d="M14 3.5V7.5H18" />
    </svg>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m12 3 8 4.5-8 4.5-8-4.5z" />
      <path d="m4 12.5 8 4.5 8-4.5M4 17l8 4.5 8-4.5" />
    </svg>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="8.5" cy="10" r="1.6" />
      <path d="m4 17 4.5-4 3.5 3 3-2.5L20 17" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M16.8 7.2h.01" />
    </svg>
  );
}

export function LinkedinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M3 9.5h4v11H3zM9.5 9.5h3.8v1.5c.6-1 1.8-1.8 3.5-1.8 2.6 0 4.2 1.7 4.2 4.8v6h-4v-5.4c0-1.4-.6-2.3-1.9-2.3-1.1 0-1.8.8-1.8 2.3v5.4h-3.8z" />
    </svg>
  );
}

export function TelegramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.5 4.3 2.9 11.4c-.9.3-.9 1.5.1 1.7l4.4 1.3 1.7 5c.3.8 1.3 1 1.9.4l2.4-2.3 4.3 3.2c.7.5 1.7.1 1.9-.7l3.1-14.4c.2-.9-.7-1.6-1.2-1.3M9.6 14.4l8.2-5.6-6.5 6.6-.3 3.1z" />
    </svg>
  );
}

export function BehanceIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M2.5 5h6.1c2.6 0 4.2 1.2 4.2 3.3 0 1.3-.7 2.2-1.8 2.7 1.5.4 2.4 1.5 2.4 3.1 0 2.4-1.8 3.9-4.8 3.9H2.5zm3.2 4.9h2.3c1 0 1.6-.5 1.6-1.3s-.6-1.2-1.6-1.2H5.7zm0 5.2h2.6c1.2 0 1.8-.5 1.8-1.4s-.7-1.4-1.8-1.4H5.7zM15 6.4h6v1.6h-6zM18 9.6c2.4 0 3.9 1.7 3.9 4.3v.6h-5.6c.2 1.1.9 1.7 2 1.7.8 0 1.4-.3 1.7-.9h1.9c-.4 1.8-1.8 2.8-3.7 2.8-2.4 0-4-1.7-4-4.2 0-2.6 1.6-4.3 3.8-4.3m-1.7 3.5h3.5c-.2-1-.8-1.6-1.7-1.6s-1.6.6-1.8 1.6" />
    </svg>
  );
}

export function PinterestIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.5a9.5 9.5 0 0 0-3.5 18.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.9 1.6 1.9 1.9 0 3.2-2.4 3.2-5.3 0-2.2-1.5-3.8-4.1-3.8-3 0-4.9 2.2-4.9 4.6 0 .9.3 1.6.7 2.1.2.2.2.3.1.5l-.2.9c-.1.3-.3.4-.6.3-1.5-.6-2.3-2.3-2.3-4.2 0-3.1 2.6-6 7.4-6 3.9 0 6.4 2.7 6.4 5.7 0 3.9-2.2 6.9-5.4 6.9-1.1 0-2.1-.6-2.4-1.3l-.7 2.6c-.2.9-.8 2-1.2 2.7A9.5 9.5 0 1 0 12 2.5" />
    </svg>
  );
}

export function ThreadsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21c-5 0-8-3.4-8-9s3.1-9 8.1-9c3.4 0 5.7 1.4 6.8 3.7" />
      <path d="M8.6 13.6c0 1.6 1.4 2.7 3.3 2.7 2.4 0 3.9-1.5 3.9-4.3 0-2.4-1.6-3.7-4-3.7-1.6 0-2.9.5-3.6 1.4" />
      <path d="M15.8 12c1.6.4 2.6 1.4 2.6 2.9 0 2.2-2.2 3.7-5.3 3.7" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 9.5h17M3.5 14.5h17" />
      <path d="M12 3c-2.5 2.4-2.5 15.6 0 18 2.5-2.4 2.5-15.6 0-18" />
    </svg>
  );
}

export function WhatsappIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21.5l5-1.3A9 9 0 1 0 12 3m0 1.8a7.2 7.2 0 1 1-3.7 13.4l-.4-.2-2.8.7.7-2.7-.2-.4A7.2 7.2 0 0 1 12 4.8m-3 3.4c-.2 0-.5.1-.7.4-.3.3-.6.8-.6 1.6s.6 1.6 1.6 2.9c1 1.2 2.2 2 3.6 2.4 1.1.3 1.6.2 2-.1.4-.3.6-.9.6-1.2s0-.3-.2-.4l-1.4-.7c-.2-.1-.4-.1-.5.1l-.5.6c-.1.2-.3.2-.5.1a6 6 0 0 1-2.8-2.6c-.1-.2 0-.3.1-.4l.4-.5c.1-.2.1-.3 0-.5l-.6-1.4c-.1-.3-.3-.3-.5-.3z" />
    </svg>
  );
}

export const socialIconMap = {
  instagram: InstagramIcon,
  linkedin: LinkedinIcon,
  telegram: TelegramIcon,
  behance: BehanceIcon,
  pinterest: PinterestIcon,
  threads: ThreadsIcon,
  whatsapp: WhatsappIcon,
} as const;

export const productTypeIconMap = {
  دورة: VideoIcon,
  كتاب: BookIcon,
  كتيّب: BookIcon,
  معسكر: LayersIcon,
  ملف: FileIcon,
  قالب: FileIcon,
} as const;
