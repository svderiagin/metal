import type {Metadata} from "next";
import {HeroSection} from "@/components/home/HeroSection";
import {CatalogSection} from "@/components/home/CatalogSection";
import {AdvantagesSection} from "@/components/home/AdvantagesSection";
import {ServicesSection} from "@/components/home/ServicesSection";
import {RequestQuoteSection} from "@/components/home/RequestQuoteSection";
import {PageContainer} from "@/components/layout/PageContainer";
import {ProductTypeCard} from "@/components/catalog/ProductTypeCard";
import {getAllProductTypes, getAllProductVariants} from "@/lib/catalog";

export const metadata: Metadata = {title: {absolute: "ООО РВБ — Металлоконструкции и металлопрокат"}};
export default function Home() {
  const productTypes = getAllProductTypes();
  const variants = getAllProductVariants();
  const featuredProducts = ["armatura-a500s", "truba-profilnaya-kvadratnaya", "galvanized-steel-sheet"]
    .flatMap(slug => productTypes.filter(productType => productType.slug === slug));
  return (
    <>
      <HeroSection/>
      <PageContainer className="space-y-9 py-7 sm:space-y-10 sm:py-8 lg:space-y-12 lg:py-10">
        <CatalogSection/>
        <section aria-labelledby="home-products-heading">
          <div className="mb-5">
            <p className="mb-1 text-eyebrow uppercase text-slate-500 dark:text-slate-400">Подбор продукции</p>
            <h2 id="home-products-heading" className="text-section-title">Размеры и цены</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Характеристики и расчёт количества — в таблице выбранного типа продукции.</p>
          </div>
          <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map(productType => <ProductTypeCard key={productType.id} productType={productType}
              variants={variants.filter(variant => variant.productTypeId === productType.id)}
              categorySlug={productType.categorySlug} subcategorySlug={productType.subcategorySlug} appearance="home"/>)}
          </div>
        </section>
        <AdvantagesSection/>
        <ServicesSection/>
        <RequestQuoteSection appearance="home"/>
      </PageContainer>
    </>
  );
}
