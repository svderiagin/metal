import type {Metadata} from "next";
import {HeroSection} from "@/components/home/HeroSection";
import {CatalogSection} from "@/components/home/CatalogSection";
import {OrderGuideSection} from "@/components/home/OrderGuideSection";
import {PartnersSection} from "@/components/home/PartnersSection";
import {RequestQuoteSection} from "@/components/home/RequestQuoteSection";
import {PageContainer} from "@/components/layout/PageContainer";
import {companyDetails} from "@/lib/companyDetails";

export const metadata: Metadata = {
  title: {absolute: `Металлопрокат с доставкой | ${companyDetails.brandName}`},
  description: "Арматура, трубы, балки и листовой прокат. Сравните размеры и цены в каталоге или запросите расчёт по спецификации. Оплата по счёту, доставка и самовывоз.",
};

export default function Home() {
  return (
    <>
      <HeroSection/>
      <PageContainer className="space-y-10 pt-5 pb-10 sm:space-y-12 sm:pt-7 sm:pb-12 lg:space-y-14 lg:pt-8 lg:pb-14">
        <CatalogSection/>
        <OrderGuideSection/>
        <PartnersSection/>
        <RequestQuoteSection appearance="home"/>
      </PageContainer>
    </>
  );
}
