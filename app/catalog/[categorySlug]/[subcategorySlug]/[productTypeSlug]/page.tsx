import type {Metadata} from "next";
import {Suspense} from "react";
import {notFound, redirect} from "next/navigation";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {CatalogSidebar} from "@/components/catalog/CatalogSidebar";
import {CatalogDescription} from "@/components/catalog/CatalogDescription";
import {ProductVariantCatalog} from "@/components/catalog/ProductVariantCatalog";
import {ProductCatalogIntro} from "@/components/catalog/ProductCatalogIntro";
import {getCatalogCoverImages} from "@/lib/catalogCoverImages";
import {importedCatalogDescriptionCopy} from "@/data/catalog-imported-description-copy";
import {getSheetPresentation} from "@/lib/sheetPresentation";
import {PageContainer} from "@/components/layout/PageContainer";
import {
  getAllProductTypes,
  getCategoryById,
  getCategoryBySlug,
  getProductTypeBySlug,
  getProductVariantsByTypeId,
  getSubcategoryById,
  getSubcategoryBySlug,
} from "@/lib/catalog";

const rebarHeadings: Record<string, string> = {
  "cat-arm-sub-1": "Арматура рифлёная А500С",
  "cat-arm-sub-2": "Арматура рифлёная А400 (А3), 35ГС",
  "cat-arm-sub-3": "Арматура рифлёная А400 (А3), 25Г2С",
  "cat-arm-sub-4": "Арматура гладкая А240 (А1)",
};

type Props = {
  params: Promise<{
    categorySlug: string;
    subcategorySlug: string;
    productTypeSlug: string;
  }>;
};

export function generateStaticParams() {
  return getAllProductTypes().flatMap((productType) => {
    const category = getCategoryById(productType.categoryId);
    if (!category) return [];

    const subcategory = getSubcategoryById(productType.subcategoryId);
    if (!subcategory || subcategory.categoryId !== category.id) return [];

    return [{
      categorySlug: category.slug,
      subcategorySlug: subcategory.slug,
      productTypeSlug: productType.slug,
    }];
  });
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const resolved = resolveProductType(await params);
  if (!resolved) return {title: "Тип продукции не найден"};

  const {productType} = resolved;
  const sheet = getSheetPresentation(productType.subcategoryId);
  return {
    title: productType.name,
    description: importedCatalogDescriptionCopy[productType.subcategoryId]?.intro ?? sheet?.intro ?? productType.shortDescription,
  };
}

export default async function ProductTypePage({params}: Props) {
  const routeParams = await params;
  const resolved = resolveProductType(routeParams);
  if (!resolved) notFound();

  const {category, productType} = resolved;
  if (category.directProducts) redirect(`/catalog/${category.slug}`);
  const variants = getProductVariantsByTypeId(productType.id);
  const sheet = getSheetPresentation(productType.subcategoryId);
  const copy = importedCatalogDescriptionCopy[productType.subcategoryId];
  const title = productType.name;
  const intro = copy?.intro ?? (sheet ? sheet.intro ?? productType.shortDescription : productType.description);
  const sourceDetails = productType.description.startsWith(productType.shortDescription)
    ? productType.description.slice(productType.shortDescription.length).trim()
    : productType.description;
  const details = copy?.details ?? (sheet ? sourceDetails : "");
  const detailsTitle = copy?.title ?? sheet?.detailsTitle;
  const images = getCatalogCoverImages(productType.id,
    productType.imageUrl && !productType.imageUrl.endsWith(".svg") ? productType.imageUrl : "");

  return (
    <PageContainer className="py-8 sm:py-10 lg:py-12">
      <Breadcrumbs
        items={[
          {label: "Каталог", href: "/catalog"},
          {label: category.name, href: `/catalog/${category.slug}`},
          {label: title},
        ]}
      />

      <div className="grid gap-7 lg:grid-cols-[280px_minmax(0,1fr)] lg:grid-rows-[max-content_minmax(0,1fr)]">
        <div className="lg:row-span-2 lg:[&>aside]:h-full">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700"/>}>
            <CatalogSidebar activeSlug={category.slug}/>
          </Suspense>
        </div>
        <ProductCatalogIntro key={productType.id} title={rebarHeadings[productType.subcategoryId] ?? title}
          label={sheet || copy ? "Подкатегория" : "Тип продукции"} images={images} description={intro} coverName={title}/>
        <ProductVariantCatalog variants={variants} categorySlug={category.slug}/>
        {detailsTitle && details && <section className="min-w-0 max-w-[800px] lg:col-start-2" aria-labelledby="product-type-details-heading">
          <h2 id="product-type-details-heading" className="text-section-title leading-tight">{detailsTitle}</h2>
          <CatalogDescription description={details} variant="categoryDetails" className="mt-4"/>
        </section>}
      </div>
    </PageContainer>
  );
}

function resolveProductType({
  categorySlug,
  subcategorySlug,
  productTypeSlug,
}: {
  categorySlug: string;
  subcategorySlug: string;
  productTypeSlug: string;
}) {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return null;

  const subcategory = getSubcategoryBySlug(category.id, subcategorySlug);
  if (!subcategory) return null;

  const productType = getProductTypeBySlug(subcategory.id, productTypeSlug);
  if (!productType || productType.categoryId !== category.id) return null;

  return {category, subcategory, productType};
}
