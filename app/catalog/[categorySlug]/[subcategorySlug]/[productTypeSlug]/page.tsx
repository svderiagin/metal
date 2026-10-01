import type {Metadata} from "next";
import {Suspense} from "react";
import {notFound} from "next/navigation";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {CatalogSidebar} from "@/components/catalog/CatalogSidebar";
import {ProductVariantCatalog} from "@/components/catalog/ProductVariantCatalog";
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

  return {
    title: resolved.productType.name,
    description: resolved.productType.shortDescription,
  };
}

export default async function ProductTypePage({params}: Props) {
  const resolved = resolveProductType(await params);
  if (!resolved) notFound();

  const {category, subcategory, productType} = resolved;
  const variants = getProductVariantsByTypeId(productType.id);

  return (
    <PageContainer className="py-8 sm:py-10 lg:py-12">
      <Breadcrumbs
        items={[
          {label: "Каталог", href: "/catalog"},
          {label: category.name, href: `/catalog/${category.slug}`},
          {label: subcategory.name},
          {label: productType.name},
          {label: "Варианты продукции"},
        ]}
      />

      <div className="grid gap-7 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="lg:row-span-2">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-slate-200"/>}>
            <CatalogSidebar activeSlug={category.slug}/>
          </Suspense>
        </div>
        <div className="min-w-0">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-red-700">
              Тип продукции
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">{productType.name}</h1>
            <p className="mt-4 max-w-4xl leading-7 text-slate-600">{productType.description}</p>
          </div>
        </div>
        <ProductVariantCatalog variants={variants} categorySlug={category.slug}/>
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
