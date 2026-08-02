import { getSiteChrome } from "@/lib/content";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { NavigationProgress } from "@/components/navigation-progress";
import { SiteTransitions } from "@/components/site-transitions";
import { ShopProvider } from "@/components/shop/shop-provider";
import { SiteChatLazy } from "@/components/chat/site-chat-lazy";
import { Toaster } from "@/components/ui/sonner";

export const revalidate = 60;

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { settings, socials } = await getSiteChrome();

  return (
    <SiteTransitions>
      <ShopProvider>
        <NavigationProgress />
        <Navbar
          designerName={settings.designerName}
          avatarUrl={settings.avatarUrl}
          projectRequestFormUrl={settings.projectRequestFormUrl}
        />
        {children}
        <Footer settings={settings} socials={socials} />
        <SiteChatLazy />
        <Toaster richColors position="top-center" />
      </ShopProvider>
    </SiteTransitions>
  );
}
