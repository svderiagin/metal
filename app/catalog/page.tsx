import type {Metadata} from "next";
import {Suspense} from "react";
import {PageContainer} from "@/components/layout/PageContainer";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {CatalogSidebar} from "@/components/catalog/CatalogSidebar";
import {CategoryGrid} from "@/components/catalog/CategoryGrid";
import {ProductTypeGrid} from "@/components/catalog/ProductTypeGrid";
import {SectionHeading} from "@/components/ui/SectionHeading";
import {CatalogSearch} from "@/components/catalog/CatalogSearch";
import {getAllCategories, getAllProductTypes, getAllProductVariants} from "@/lib/catalog";
import {storefrontProduct} from "@/lib/storefrontProduct";
import {catalogDescriptionCopy} from "@/data/catalog-description-copy";

export const metadata: Metadata = {
  title: "Каталог металлопроката",
  description: "Арматура, стальные трубы, балки, листовой и сортовой прокат, профнастил, сетка и штакетник. Размеры, цены и наличие."
};
export default function CatalogPage() {
  return <PageContainer withBreadcrumbs className="pb-8 lg:pb-10">
    <Breadcrumbs items={[{label: "Каталог"}]}/>
    <h1 className="text-page-title">Каталог металлопроката</h1>
    <div className="mt-5 grid gap-4 lg:mt-7 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-7"><CatalogSidebar/>
      <div>
        <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700"/>}>
          <CatalogSearch
            categories={getAllCategories().map(({id, name, shortDescription}) => ({
              id, name, description: catalogDescriptionCopy[id]?.intro ?? shortDescription,
            }))}
            productTypes={getAllProductTypes().map(type => {
              const copy = catalogDescriptionCopy[type.subcategoryId] ?? catalogDescriptionCopy[type.categoryId];
              return {...type, description: copy?.intro ?? type.shortDescription};
            })}
            variants={getAllProductVariants().map(storefrontProduct)}
          />
        </Suspense>
        <div className="mt-8">
          <CategoryGrid categories={getAllCategories()}/>
        </div>
        <section className="mt-10"><SectionHeading title="Подбор продукции"
                                                   description="Типы продукции из разных разделов каталога."/><ProductTypeGrid
          productTypes={getAllProductTypes().slice(0, 6)}
          variants={getAllProductVariants()}/></section>
      </div>
    </div>
  </PageContainer>
}
