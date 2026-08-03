import { getHomeContent } from "@/lib/content";
import { Hero } from "@/components/home/hero";
import { Stats } from "@/components/home/stats";
import { LatestWork } from "@/components/home/latest-work";
import { Products } from "@/components/home/products";
import { FeaturedBanner } from "@/components/home/featured-banner";
import { Awards } from "@/components/home/awards";
import { DigitalImpact } from "@/components/home/digital-impact";
import { CurrentlyWorking } from "@/components/home/currently-working";
import { CareerHighlights } from "@/components/home/career-highlights";
import { ClientLogos } from "@/components/home/client-logos";
import { Testimonials } from "@/components/home/testimonials";
import { Faq } from "@/components/home/faq";

/** المحتوى يُدار من لوحة التحكم، فتُعاد المولّدة كل دقيقة أو عند أي تعديل */
export const revalidate = 60;

export default async function HomePage() {
  const content = await getHomeContent();

  return (
    <main>
      <Hero settings={content.settings} />
      <Stats stats={content.stats} />
      <LatestWork projects={content.projects} />
      <ClientLogos logos={content.clientLogos} />
      <Products products={content.products} />
      <FeaturedBanner banner={content.banner} />
      <Awards awards={content.awards} />
      <DigitalImpact items={content.digitalImpact} />
      <CurrentlyWorking tasks={content.tasks} />
      <CareerHighlights highlights={content.highlights} />
      <Testimonials testimonials={content.testimonials} />
      <Faq faqs={content.faqs} />
    </main>
  );
}
