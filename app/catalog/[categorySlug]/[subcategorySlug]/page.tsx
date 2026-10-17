import {notFound, redirect} from "next/navigation";
import type {Metadata} from "next";
import {Suspense} from "react";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {CatalogSidebar} from "@/components/catalog/CatalogSidebar";
import {CatalogDescription} from "@/components/catalog/CatalogDescription";
import {ProductTypeResults} from "@/components/catalog/ProductTypeResults";
import {PageContainer} from "@/components/layout/PageContainer";
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
  return {title: subcategory ? subcategory.name : "Каталог"};
}

export default async function SubcategoryPage({params}: Props) {
  const {categorySlug, subcategorySlug} = await params;
  const category = getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const currentSubcategory = getSubcategoryBySlug(category.id, subcategorySlug);
  if (currentSubcategory) {
    const productTypes = getProductTypesBySubcategoryId(currentSubcategory.id);
    const variants = getProductVariantsByCategoryId(category.id)
      .filter((variant) => variant.subcategoryId === currentSubcategory.id);

    return (
      <PageContainer className="py-8 sm:py-10 lg:py-12">
        <Breadcrumbs items={[
          {label: "Каталог", href: "/catalog"},
          {label: category.name, href: `/catalog/${category.slug}`},
          {label: currentSubcategory.name},
        ]}/>
        <div className="grid gap-7 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-slate-200"/>}>
            <CatalogSidebar activeSlug={category.slug}/>
          </Suspense>
          <div className="min-w-0">
            <h1 className="text-3xl font-black">{currentSubcategory.name}</h1>
            <CatalogDescription description={currentSubcategory.description}/>
            <ProductTypeResults productTypes={productTypes} variants={variants}/>
          </div>
        </div>
      </PageContainer>
    );
  }

  const variant = getProductVariantBySlug(subcategorySlug);
  if (!variant || variant.categoryId !== category.id) {
    notFound();
  }

  const subcategory = getSubcategoryById(variant.subcategoryId);
  const productType = getProductTypeById(variant.productTypeId);
  if (!subcategory || !productType) notFound();

  redirect(
    `/catalog/${category.slug}/${subcategory.slug}/${productType.slug}#variant-${variant.id}`,
  );
}
