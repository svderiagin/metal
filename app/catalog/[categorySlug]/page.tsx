import {catalogImageUrl} from "@/lib/catalog-image";
import type {Metadata} from "next";
import {Suspense} from "react";
import Image from "next/image";
import {DesktopImagePreload} from "@/components/catalog/DesktopImagePreload";
import {notFound} from "next/navigation";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {CatalogSidebar} from "@/components/catalog/CatalogSidebar";
import {CatalogDescription} from "@/components/catalog/CatalogDescription";
import {ProductTypeResults} from "@/components/catalog/ProductTypeResults";
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

const imageSizes = "(min-width: 1280px) 360px, (min-width: 768px) 320px, calc(100vw - 48px)";

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
  const introDescription = category.descriptionSections?.intro ?? category.description;
  const detailedDescription = category.descriptionSections?.details;

  return (
    <PageContainer className="py-8 sm:py-10 lg:py-12">
      {hasImage && <DesktopImagePreload src={catalogImageUrl(mainImageUrl)} sizes={imageSizes}/>}
      <Breadcrumbs items={[{label: "Каталог", href: "/catalog"}, {label: category.name}]}/>
      <div className="grid gap-7 lg:grid-cols-[280px_1fr]">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700"/>}>
          <CatalogSidebar activeSlug={category.slug}/>
        </Suspense>
        <div className="min-w-0">
          <div className={`grid gap-x-6 gap-y-4 ${hasImage ? "md:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
            <h1 className="text-[1.625rem] font-bold leading-[1.2] sm:text-3xl">{category.name}</h1>
            {hasImage && <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl bg-white md:col-start-2 md:row-span-2 md:row-start-1 md:self-center">
              <Image src={catalogImageUrl(mainImageUrl)} alt={category.name} fill
                sizes={imageSizes}
                className="object-contain object-center"/>
            </div>}
            <CatalogDescription description={introDescription} variant="category" className="md:col-start-1"/>
          </div>
          {category.directProducts
            ? <div className="mt-8 min-w-0 space-y-7"><ProductVariantCatalog variants={variants} categorySlug={category.slug}/></div>
            : <ProductTypeResults productTypes={productTypes} variants={variants}/>}
          {detailedDescription && <section className="mt-12 max-w-[800px]" aria-labelledby={`${category.id}-details-heading`}>
            <h2 id={`${category.id}-details-heading`} className="text-2xl font-bold leading-tight">
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
