import type {Metadata} from "next";
import {PageContainer} from "@/components/layout/PageContainer";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {CatalogSidebar} from "@/components/catalog/CatalogSidebar";
import {CategoryGrid} from "@/components/catalog/CategoryGrid";
import {ProductGrid} from "@/components/catalog/ProductGrid";
import {SectionHeading} from "@/components/ui/SectionHeading";
import {getAllCategories, getAllProducts} from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Каталог металлопроката",
  description: "Трубы, листовой и сортовой прокат, нержавеющая сталь, метизы и цветные металлы."
};
export default function CatalogPage() {
  return <PageContainer className="py-8 sm:py-10 lg:py-12"><Breadcrumbs items={[{label: "Каталог"}]}/><h1
    className="text-3xl font-black">Каталог металлопроката</h1><p className="mt-3 max-w-3xl text-slate-600">Выберите
    раздел или просмотрите доступные складские позиции. Итоговые условия поставки зависят от объёма и обработки.</p>
    <div className="mt-7 grid gap-7 lg:grid-cols-[250px_1fr]"><CatalogSidebar/>
      <div><CategoryGrid categories={getAllCategories()}/>
        <section className="mt-10"><SectionHeading title="Товары со склада"
                                                   description="Популярные позиции из разных разделов каталога."/><ProductGrid
          products={getAllProducts().slice(0, 6)}/></section>
      </div>
    </div>
  </PageContainer>
}
