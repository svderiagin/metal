import {notFound, redirect} from "next/navigation";
import type {Metadata} from "next";
import {Suspense} from "react";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {CatalogSidebar} from "@/components/catalog/CatalogSidebar";
import {CatalogDescription} from "@/components/catalog/CatalogDescription";
import {CatalogProductDetail} from "@/components/catalog/CatalogProductDetail";
import {ProductCatalogIntro} from "@/components/catalog/ProductCatalogIntro";
import {ProductTypeResults} from "@/components/catalog/ProductTypeResults";
import {PageContainer} from "@/components/layout/PageContainer";
import {getCatalogCoverImages} from "@/lib/catalogCoverImages";
import {catalogDescriptionCopy} from "@/data/catalog-description-copy";
import {getChannelProductDescription} from "@/lib/channelDescription";
import {
  getAllCategories,
  getAllProductVariants,
  getCategoryById,
  getCategoryBySlug,
  getProductTypeById,
  getProductVariantBySlug,
  getSubcategoryById,
  getSubcategoryBySlug,
  getSubcategoriesByCategoryId,
  getProductTypesBySubcategoryId,
  getProductVariantsByCategoryId,
} from "@/lib/catalog";

type Props = {
  params: Promise<{
    categorySlug: string;
    subcategorySlug: string;
  }>;
};

// Include subcategories and former product URLs to preserve legacy redirects.
export function generateStaticParams() {
  const subcategoryParams = getAllCategories().flatMap((category) =>
    getSubcategoriesByCategoryId(category.id).map((subcategory) => ({
      categorySlug: category.slug,
      subcategorySlug: subcategory.slug,
    })),
  );
  const legacyParams = getAllProductVariants().flatMap((variant) => {
    const category = getCategoryById(variant.categoryId);
    return category
      ? [{categorySlug: category.slug, subcategorySlug: variant.slug}]
      : [];
  });
  return [...new Map([...subcategoryParams, ...legacyParams].map((params) =>
    [`${params.categorySlug}/${params.subcategorySlug}`, params],
  )).values()];
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {categorySlug, subcategorySlug} = await params;
  const category = getCategoryBySlug(categorySlug);
  const subcategory = category && getSubcategoryBySlug(category.id, subcategorySlug);
  const variant = categorySlug === "shveller" && category && getProductVariantBySlug(subcategorySlug);
  if (!subcategory && category && variant && variant.categoryId === category.id) {
    return {title: variant.name, description: getChannelProductDescription(variant).split("\n\n")[0]};
  }
  return subcategory ? {
    title: subcategory.name,
    description: catalogDescriptionCopy[subcategory.id]?.intro ?? subcategory.shortDescription,
  } : {title: "Каталог"};
}

export default async function SubcategoryPage({params}: Props) {
  const {categorySlug, subcategorySlug} = await params;
  const category = getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const currentSubcategory = getSubcategoryBySlug(category.id, subcategorySlug);
  if (currentSubcategory) {
    if (currentSubcategory.internal) redirect(`/catalog/${category.slug}`);
    const productTypes = getProductTypesBySubcategoryId(currentSubcategory.id);
    const [productType] = productTypes;
    const copy = catalogDescriptionCopy[currentSubcategory.id];
    const intro = copy?.intro ?? currentSubcategory.description;
    const coverImages = productTypes.length === 1
      ? getCatalogCoverImages(productType.id, productType.imageUrl ?? "")
      : [];
    const variants = getProductVariantsByCategoryId(category.id)
      .filter((variant) => variant.subcategoryId === currentSubcategory.id);

    return (
      <PageContainer className="py-5 sm:py-6 lg:py-7">
        <Breadcrumbs items={[
          {label: "Каталог", href: "/catalog"},
          {label: category.name, href: `/catalog/${category.slug}`},
          {label: currentSubcategory.name},
        ]}/>
        <div className="grid gap-5 lg:grid-cols-[244px_minmax(0,1fr)] lg:gap-6">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700"/>}>
            <CatalogSidebar activeSlug={category.slug}/>
          </Suspense>
          <div className="min-w-0">
            <ProductCatalogIntro key={currentSubcategory.id} title={currentSubcategory.name} label="Подкатегория"
              summary={`Типов: ${productTypes.length}`} resultsHref="#catalog-types" resultsLabel="Выбрать продукцию"
              detailsId={copy ? "subcategory-details-heading" : undefined} images={coverImages} description={intro}/>
            <ProductTypeResults productTypes={productTypes} variants={variants}/>
            {copy && <section className="mt-12 max-w-[800px]" aria-labelledby="subcategory-details-heading">
              <h2 id="subcategory-details-heading" className="text-section-title">{copy.title}</h2>
              <CatalogDescription description={copy.details} variant="categoryDetails" className="mt-4"/>
            </section>}
          </div>
        </div>
      </PageContainer>
    );
  }

  const variant = getProductVariantBySlug(subcategorySlug);
  if (!variant || variant.categoryId !== category.id) {
    notFound();
  }
  if (category.slug === "shveller") return <CatalogProductDetail category={category} variant={variant}/>;
  if (category.directProducts) redirect(`/catalog/${category.slug}#variant-${variant.id}`);

  const subcategory = getSubcategoryById(variant.subcategoryId);
  const productType = getProductTypeById(variant.productTypeId);
  if (!subcategory || !productType) notFound();

  redirect(
    `/catalog/${category.slug}/${subcategory.slug}/${productType.slug}#variant-${variant.id}`,
  );
}
