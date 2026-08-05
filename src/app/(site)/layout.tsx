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
    <ShopProvider>
      <SiteTransitions>
        <NavigationProgress />
        <Navbar
          designerName={settings.designerName}
          avatarUrl={settings.avatarUrl}
          navbarLogoUrl={settings.navbarLogoUrl}
        />
        {children}
        <Footer settings={settings} socials={socials} />
        <Toaster richColors position="top-center" />
      </SiteTransitions>
      <SiteChatLazy />
    </ShopProvider>
  );
}
