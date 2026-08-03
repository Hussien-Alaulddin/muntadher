import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Tajawal } from "next/font/google";
import { DirectionProvider } from "@/components/ui/direction";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSiteChrome } from "@/lib/content";
import "./globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-ibm-plex-arabic",
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteChrome();
  const mark = settings.brandMarkUrl?.trim();

  return {
    title: `${settings.siteName || "منتظر"} | ${settings.siteTagline || "مُصمّم هُويّات بصريّة"}`,
    description:
      "اعمل على تحويل العلامة الى قصة، والقصة الى هُويّة بصريّة، من خلال منهجية تعتمد على بناء استراتيجي للعلامة",
    icons: mark
      ? {
          icon: [{ url: mark }],
          apple: [{ url: mark }],
          shortcut: mark,
        }
      : undefined,
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${ibmPlexArabic.variable} ${tajawal.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://framerusercontent.com" />
      </head>
      <body className="font-arabic antialiased">
        <DirectionProvider dir="rtl">
          <TooltipProvider>{children}</TooltipProvider>
        </DirectionProvider>
      </body>
    </html>
  );
}
