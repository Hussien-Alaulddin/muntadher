import { getProductsPageContent } from "@/lib/content";
import { ProductsHero } from "@/components/products/products-hero";
import { ProductsArchive } from "@/components/products/products-archive";

export const revalidate = 60;

export default async function ProductsPage() {
  const content = await getProductsPageContent();

  return (
    <main>
      <ProductsHero />
      <ProductsArchive
        corePrograms={content.corePrograms}
        resources={content.resources}
      />
    </main>
  );
}
