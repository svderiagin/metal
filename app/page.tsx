import type {Metadata} from "next";
import {HeroSection} from "@/components/home/HeroSection";
import {CatalogSection} from "@/components/home/CatalogSection";
import {AdvantagesSection} from "@/components/home/AdvantagesSection";
import {ServicesSection} from "@/components/home/ServicesSection";
import {RequestQuoteSection} from "@/components/home/RequestQuoteSection";
import {PageContainer} from "@/components/layout/PageContainer";
import {ProductTypeGrid} from "@/components/catalog/ProductTypeGrid";
import {SectionHeading} from "@/components/ui/SectionHeading";
import {getAllProductTypes, getAllProductVariants} from "@/lib/catalog";

export const metadata: Metadata = {title: {absolute: "Metal Store — металлопрокат и стальные трубы"}};
export default function Home() {
  return (
    <>
      <HeroSection/>
      <PageContainer className="space-y-16 py-12 sm:py-16 lg:space-y-20 lg:py-20">
        <CatalogSection/>
        <section>
          <SectionHeading
            eyebrow="В наличии"
            title="Популярные позиции"
            description="Базовые позиции для строительства, производства и ремонта."
          />
          <ProductTypeGrid
            productTypes={getAllProductTypes().slice(0, 6)}
            variants={getAllProductVariants()}
          />
        </section>
        <AdvantagesSection/>
        <ServicesSection/>
        <RequestQuoteSection/>
      </PageContainer>
    </>
  );
}
