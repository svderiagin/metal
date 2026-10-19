import type {Metadata} from "next";
import {Suspense} from "react";
import {notFound, redirect} from "next/navigation";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {CatalogSidebar} from "@/components/catalog/CatalogSidebar";
import {CatalogDescription} from "@/components/catalog/CatalogDescription";
import {ProductVariantCatalog} from "@/components/catalog/ProductVariantCatalog";
import {ProductImageViewer} from "@/components/catalog/ProductImageViewer";
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

  return {
    title: resolved.productType.name,
    description: resolved.productType.shortDescription,
  };
}

export default async function ProductTypePage({params}: Props) {
  const routeParams = await params;
  const resolved = resolveProductType(routeParams);
  if (!resolved) notFound();

  const {category, productType} = resolved;
  if (category.directProducts) redirect(`/catalog/${category.slug}`);
  const variants = getProductVariantsByTypeId(productType.id);

  return (
    <PageContainer className="py-8 sm:py-10 lg:py-12">
      <Breadcrumbs
        items={[
          {label: "Каталог", href: "/catalog"},
          {label: category.name, href: `/catalog/${category.slug}`},
          {label: productType.name},
        ]}
      />

      <div className="grid gap-7 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="lg:row-span-2 lg:[&>aside]:h-full">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700"/>}>
            <CatalogSidebar activeSlug={category.slug}/>
          </Suspense>
        </div>
        <div className="min-w-0">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-6 lg:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-red-700 dark:text-red-400">
              Тип продукции
            </p>
            <h1 className="mt-2 break-words text-3xl font-black sm:text-4xl">{rebarHeadings[productType.subcategoryId] ?? productType.name}</h1>
            {productType.imageUrl && !productType.imageUrl.endsWith(".svg") &&
              <ProductImageViewer src={productType.imageUrl} name={productType.name}/>}
            <CatalogDescription description={productType.description}/>
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
