import { getHandbookPageContent } from "@/lib/content";
import { Faq } from "@/components/home/faq";
import { HandbookHero } from "@/components/handbook/handbook-hero";
import { PhilosophyPillars } from "@/components/handbook/philosophy-pillars";
import { ProcessSteps } from "@/components/handbook/process-steps";

export const revalidate = 60;

export default async function HandbookPage() {
  const content = await getHandbookPageContent();

  return (
    <main>
      <HandbookHero />
      <PhilosophyPillars />
      <ProcessSteps />
      <Faq faqs={content.faqs} />
    </main>
  );
}
