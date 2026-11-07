import {getCatalogCoverImages} from "@/lib/catalogCoverImages";
import {catalogDescriptionCopy} from "@/data/catalog-description-copy";
import type {Metadata} from "next";
import {Suspense} from "react";
import {notFound} from "next/navigation";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {CatalogSidebar} from "@/components/catalog/CatalogSidebar";
import {CatalogDescription} from "@/components/catalog/CatalogDescription";
import {CatalogListingNavigation} from "@/components/catalog/CatalogListingNavigation";
import {ProductTypeResults} from "@/components/catalog/ProductTypeResults";
import {ProductCatalogIntro} from "@/components/catalog/ProductCatalogIntro";
import {ProductVariantCatalog} from "@/components/catalog/ProductVariantCatalog";
import {PageContainer} from "@/components/layout/PageContainer";
import {ButtonLink} from "@/components/ui/Button";
import {
  getAllCategories,
  getCategoryBySlug,
  getProductTypesByCategoryId,
  getProductVariantsByCategoryId,
} from "@/lib/catalog";

type Props = {
  params: Promise<{ categorySlug: string }>;
};

export function generateStaticParams() {
  return getAllCategories().map((category) => ({categorySlug: category.slug}));
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {categorySlug} = await params;
  const category = getCategoryBySlug(categorySlug);
  if (!category) return {title: "Категория не найдена"};
  return {title: category.name, description: catalogDescriptionCopy[category.id]?.intro ?? category.shortDescription};
}

export default async function CategoryPage({params}: Props) {
  const {categorySlug} = await params;
  const category = getCategoryBySlug(categorySlug);
  if (!category) notFound();
  const productTypes = getProductTypesByCategoryId(category.id);
  const variants = getProductVariantsByCategoryId(category.id);
  const mainImageUrl = category.id === "cat-trp"
    ? "/images/catalog/truby-profilnye/trubi-main.jpg"
    : category.imageUrl;
  const coverImages = getCatalogCoverImages(category.id,
    category.id === "cat-pnf" || mainImageUrl.endsWith(".svg") ? "" : mainImageUrl);
  const hasImage = coverImages.length > 0;
  const description = catalogDescriptionCopy[category.id] ?? category.descriptionSections;
  const introDescription = description?.intro ?? category.description;
  const detailedDescription = description?.details;

  if (category.directProducts) {
    return (
      <PageContainer className="py-8 sm:py-10 lg:py-12">
        <Breadcrumbs items={[{label: "Каталог", href: "/catalog"}, {label: category.name}]}/>
        <div className="flex flex-col gap-6">
          <CatalogListingNavigation category={category}/>
          <ProductCatalogIntro key={category.id} title={category.name} label="Категория"
            detailsId={detailedDescription ? `${category.id}-details-heading` : undefined}
            images={hasImage ? coverImages : []} description={introDescription}/>
          <ProductVariantCatalog variants={variants} categorySlug={category.slug}>
            <div className="min-w-0">
              {detailedDescription && <section className="max-w-[800px]" aria-labelledby={`${category.id}-details-heading`}>
                <h2 id={`${category.id}-details-heading`} className="text-section-title leading-tight">
                  {description?.title ?? `Подробнее о категории «${category.name}»`}
                </h2>
                <CatalogDescription description={detailedDescription} variant="categoryDetails" className="mt-4"/>
              </section>}
            </div>
          </ProductVariantCatalog>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-8 sm:py-10 lg:py-12">
      <Breadcrumbs items={[{label: "Каталог", href: "/catalog"}, {label: category.name}]}/>
      <div className="grid gap-7 lg:grid-cols-[280px_1fr]">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700"/>}>
          <CatalogSidebar activeSlug={category.slug}/>
        </Suspense>
        <div className="min-w-0">
          <ProductCatalogIntro key={category.id} title={category.name} label="Категория"
            detailsId={detailedDescription ? `${category.id}-details-heading` : undefined}
            images={hasImage ? coverImages : []} description={introDescription}/>
          <ProductTypeResults productTypes={productTypes} variants={variants}/>
          {detailedDescription && <section className="mt-12 max-w-[800px]" aria-labelledby={`${category.id}-details-heading`}>
            <h2 id={`${category.id}-details-heading`} className="text-section-title scroll-mt-8 leading-tight">
              {description?.title ?? `Подробнее о категории «${category.name}»`}
            </h2>
            <CatalogDescription description={detailedDescription} variant="categoryDetails" className="mt-4"/>
          </section>}
          <div className="mt-10 rounded-lg bg-slate-900 p-6 text-white">
            <h2 className="text-xl font-bold">Нужна комплектация по спецификации?</h2>
            <p className="mt-2 text-slate-300">Опишите позиции и необходимые услуги — подготовим единый
              расчёт.</p>
            <ButtonLink href="/#request" className="mt-5">Запросить расчёт</ButtonLink>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
