import {getCatalogCoverImages} from "@/lib/catalogCoverImages";
import type {Metadata} from "next";
import {Suspense} from "react";
import {notFound} from "next/navigation";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {CatalogSidebar} from "@/components/catalog/CatalogSidebar";
import {CatalogDescription} from "@/components/catalog/CatalogDescription";
import {CategoryCover} from "@/components/catalog/CategoryCover";
import {ProductTypeResults} from "@/components/catalog/ProductTypeResults";
import {ProductCatalogIntro} from "@/components/catalog/ProductCatalogIntro";
import {ProductVariantCatalog} from "@/components/catalog/ProductVariantCatalog";
import {CatalogCoverGallery} from "@/components/catalog/CatalogCoverGallery";
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
  return {title: category.name, description: category.shortDescription};
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
  const hasImage = category.id !== "cat-pnf" && !mainImageUrl.endsWith(".svg");
  const coverImages = getCatalogCoverImages(category.id, mainImageUrl);
  const introDescription = category.descriptionSections?.intro ?? category.description;
  const useCoverLayout = category.slug === "armatura";
  const detailedDescription = category.descriptionSections?.details ?? (useCoverLayout ? category.description : undefined);
  const useProductPageLayout = ["shveller", "ugolok", "kvadrat"].includes(category.slug);

  if (useProductPageLayout) {
    return (
      <PageContainer className="py-8 sm:py-10 lg:py-12">
        <Breadcrumbs items={[{label: "Каталог", href: "/catalog"}, {label: category.name}]}/>
        <div className="grid gap-7 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="lg:row-span-2 lg:[&>aside]:h-full">
            <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700"/>}>
              <CatalogSidebar activeSlug={category.slug}/>
            </Suspense>
          </div>
          <ProductCatalogIntro key={category.id} title={category.name} label="Категория"
            images={hasImage ? coverImages : []} description={introDescription}/>
          <ProductVariantCatalog variants={variants} categorySlug={category.slug}/>
          <div className="min-w-0 lg:col-start-2">
            {detailedDescription && <section className="max-w-[800px]" aria-labelledby={`${category.id}-details-heading`}>
              <h2 id={`${category.id}-details-heading`} className="text-section-title leading-tight">
                {category.descriptionSections?.title ?? `Подробнее о категории «${category.name}»`}
              </h2>
              <CatalogDescription description={detailedDescription} variant="categoryDetails" className="mt-4"/>
            </section>}
            <div className="mt-10 rounded-lg bg-slate-900 p-6 text-white">
              <h2 className="text-xl font-bold">Нужна комплектация по спецификации?</h2>
              <p className="mt-2 text-slate-300">Опишите позиции и необходимые услуги — подготовим единый расчёт.</p>
              <ButtonLink href="/#request" className="mt-5">Запросить расчёт</ButtonLink>
            </div>
          </div>
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
          {useCoverLayout ? <CategoryCover key={category.id} name={category.name} images={coverImages}
            summary={category.shortDescription} descriptionId={`${category.id}-details-heading`}/>
          : <div className={`grid gap-x-6 gap-y-4 ${hasImage ? "md:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
            <h1 className={`text-page-title ${category.slug === "shtaketnik" ? "text-red-700 dark:text-red-400" : ""}`}>{category.name}</h1>
            {hasImage && <CatalogCoverGallery key={category.id} images={coverImages} name={category.name} layout="compact"
              className="md:col-start-2 md:row-span-2 md:row-start-1 md:self-center"/>}
            <CatalogDescription description={introDescription} variant="category" className="md:col-start-1"/>
          </div>}
          {category.directProducts
            ? <div className="mt-8 min-w-0 space-y-7"><ProductVariantCatalog variants={variants} categorySlug={category.slug}/></div>
            : <ProductTypeResults productTypes={productTypes} variants={variants}/>}
          {detailedDescription && <section className="mt-12 max-w-[800px]" aria-labelledby={`${category.id}-details-heading`}>
            <h2 id={`${category.id}-details-heading`} className="text-section-title scroll-mt-8 leading-tight">
              {category.descriptionSections?.title ?? `Подробнее о категории «${category.name}»`}
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
