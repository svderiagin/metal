import {Suspense} from "react";
import Link from "next/link";
import type {Category} from "@/types/category";
import type {ProductVariant} from "@/types/product";
import {PageContainer} from "@/components/layout/PageContainer";
import {Breadcrumbs} from "./Breadcrumbs";
import {CatalogSidebar} from "./CatalogSidebar";
import {CatalogDescription} from "./CatalogDescription";
import {ProductImageViewer} from "./ProductImageViewer";
import {getChannelProductDescription} from "@/lib/channelDescription";
import {ChannelSpecificationNote} from "./ChannelSpecificationNote";

export function CatalogProductDetail({category, variant}: {category: Category; variant: ProductVariant}) {
  const description = getChannelProductDescription(variant);
  const specifications = variant.specifications.filter(item => !["Полное обозначение", "Условия цены", "Условия оплаты"].includes(item.name));

  return <PageContainer className="py-8 sm:py-10 lg:py-12">
    <Breadcrumbs items={[
      {label: "Каталог", href: "/catalog"},
      {label: category.name, href: `/catalog/${category.slug}`},
      {label: variant.name},
    ]}/>
    <div className="grid gap-7 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700"/>}>
        <CatalogSidebar activeSlug={category.slug}/>
      </Suspense>
      <div className="min-w-0">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-6 lg:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-red-700 dark:text-red-400">Товар</p>
          <h1 className="mt-2 break-words text-3xl font-black sm:text-4xl">{variant.name}</h1>
          {variant.imageUrls[0] && <ProductImageViewer src={variant.imageUrls[0]} name={variant.name}/>}
          {description && <CatalogDescription description={description}/>}
          {specifications.length > 0 && <section className="mt-8" aria-labelledby="product-specifications-heading">
            <h2 id="product-specifications-heading" className="text-xl font-bold">Характеристики</h2>
            <dl className="mt-4 space-y-2 text-sm">
              {specifications.map((item, index) => <div key={`${item.name}-${index}`}>
                <dt className="inline text-slate-500 dark:text-slate-400">{item.name}: </dt>
                <dd className="inline">{item.value}</dd>
              </div>)}
            </dl>
            {category.slug === "shveller" && <ChannelSpecificationNote/>}
          </section>}
          {variant.imageUrls.slice(1).map((src, index) => <ProductImageViewer key={src} src={src} name={`${variant.name} — фото ${index + 2}`}/>)}
        </div>
        <Link href={`/catalog/${category.slug}`} className="mt-6 inline-flex min-h-11 items-center font-semibold text-red-700 dark:text-red-400 hover:underline">
          Вернуться к категории «{category.name}»
        </Link>
      </div>
    </div>
  </PageContainer>;
}
