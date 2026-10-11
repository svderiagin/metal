import {catalogImageUrl} from "@/lib/catalog-image";
import type {Metadata} from "next";
import {Suspense} from "react";
import Image from "next/image";
import {notFound} from "next/navigation";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {CatalogSidebar} from "@/components/catalog/CatalogSidebar";
import {ProductTypeResults} from "@/components/catalog/ProductTypeResults";
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
  const hasImage = !category.imageUrl.endsWith(".svg");

  return (
    <PageContainer className="py-8 sm:py-10 lg:py-12">
      <Breadcrumbs items={[{label: "Каталог", href: "/catalog"}, {label: category.name}]}/>
      <div className="grid gap-7 lg:grid-cols-[280px_1fr]">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-slate-200"/>}>
          <CatalogSidebar activeSlug={category.slug}/>
        </Suspense>
        <div className="min-w-0">
          <div className={`grid gap-x-6 gap-y-4 ${hasImage ? "md:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
            <h1 className="text-3xl font-black">{category.name}</h1>
            {hasImage && <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl bg-white md:col-start-2 md:row-span-2 md:row-start-1 md:self-center">
              <Image src={catalogImageUrl(category.imageUrl)} alt={category.name} fill
                sizes="(min-width: 1280px) 360px, (min-width: 768px) 320px, calc(100vw - 48px)"
                className="object-contain object-center"/>
            </div>}
            <p className="max-w-3xl leading-7 text-slate-600 md:col-start-1">{category.description}</p>
          </div>
          <Suspense
            fallback={<div className="mt-8 h-80 animate-pulse rounded-lg bg-slate-200"/>}
          >
            <ProductTypeResults
              productTypes={productTypes}
              variants={variants}
            />
          </Suspense>
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
