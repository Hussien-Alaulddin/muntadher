import { getHomeContent } from "@/lib/content";
import { Reveal } from "@/components/reveal";
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
      <Reveal>
        <Stats stats={content.stats} />
      </Reveal>
      <Reveal delay={40}>
        <LatestWork projects={content.projects} />
      </Reveal>
      <Reveal>
        <ClientLogos logos={content.clientLogos} />
      </Reveal>
      <Reveal delay={40}>
        <Products products={content.products} />
      </Reveal>
      <Reveal>
        <FeaturedBanner banner={content.banner} />
      </Reveal>
      <Reveal>
        <Awards awards={content.awards} />
      </Reveal>
      <Reveal delay={40}>
        <DigitalImpact items={content.digitalImpact} />
      </Reveal>
      <Reveal>
        <CurrentlyWorking tasks={content.tasks} />
      </Reveal>
      <Reveal>
        <CareerHighlights highlights={content.highlights} />
      </Reveal>
      <Reveal delay={40}>
        <Testimonials testimonials={content.testimonials} />
      </Reveal>
      <Reveal>
        <Faq faqs={content.faqs} />
      </Reveal>
    </main>
  );
}
