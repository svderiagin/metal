import type {Metadata} from "next";
import {HeroSection} from "@/components/home/HeroSection";
import {CatalogSection} from "@/components/home/CatalogSection";
import {AdvantagesSection} from "@/components/home/AdvantagesSection";
import {ServicesSection} from "@/components/home/ServicesSection";
import {RequestQuoteSection} from "@/components/home/RequestQuoteSection";
import {PageContainer} from "@/components/layout/PageContainer";
import {ProductGrid} from "@/components/catalog/ProductGrid";
import {SectionHeading} from "@/components/ui/SectionHeading";
import {getAllProducts} from "@/lib/catalog";

export const metadata: Metadata = {title: {absolute: "Metal Store — металлопрокат и стальные трубы"}};
export default function Home() {
  return <><HeroSection/><PageContainer className="space-y-14 py-10 md:space-y-18 md:py-14"><CatalogSection/>
    <section><SectionHeading eyebrow="В наличии" title="Популярные позиции"
                             description="Базовые позиции для строительства, производства и ремонта."/><ProductGrid
      products={getAllProducts().slice(0, 6)}/></section>
    <AdvantagesSection/><ServicesSection/><RequestQuoteSection/></PageContainer></>
}
