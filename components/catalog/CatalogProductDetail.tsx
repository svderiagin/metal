import Link from "next/link";
import type {Category} from "@/types/category";
import type {ProductVariant} from "@/types/product";
import {PageContainer} from "@/components/layout/PageContainer";
import {storefrontAvailability} from "@/lib/catalogOffer";
import {Breadcrumbs} from "./Breadcrumbs";
import {CatalogListingNavigation} from "./CatalogListingNavigation";
import {CatalogPositionFields} from "./CatalogPositionDetails";
import {CatalogDescription} from "./CatalogDescription";
import {ProductImageViewer} from "./ProductImageViewer";
import {getChannelProductDescription} from "@/lib/channelDescription";
import {ChannelSpecificationNote} from "./ChannelSpecificationNote";
import {storefrontPositionFields} from "./StorefrontPositionSpecifications";
import {ProductOrderControls} from "./ProductOrderControls";

export function CatalogProductDetail({category, variant}: {category: Category; variant: ProductVariant}) {
  const [introduction, , selection] = getChannelProductDescription(variant).split("\n\n");
  const fields = storefrontPositionFields(variant);
  const madeToOrder = storefrontAvailability(variant.availability) === "ON_ORDER";

  return <PageContainer className="pt-5 pb-8 sm:pt-6 lg:pt-7 lg:pb-10">
    <Breadcrumbs items={[
      {label: "Каталог", href: "/catalog"},
      {label: category.name, href: `/catalog/${category.slug}`},
      {label: variant.name},
    ]}/>
    <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
      <CatalogListingNavigation category={category}/>
      <div className="min-w-0 space-y-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:p-5 lg:space-y-8">
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-8">
          <div>
            <h1 className="text-page-title">{variant.name}</h1>
            <CatalogDescription description={[introduction, selection].filter(Boolean).join("\n\n")}/>
            {madeToOrder && <ProductOrderControls variant={variant} view="card"/>}
          </div>
          {variant.imageUrls.length > 0 && <div className="grid max-w-md gap-3">
            {variant.imageUrls.map((src, index) => <ProductImageViewer key={src} src={src}
              name={index ? `${variant.name} — фото ${index + 1}` : variant.name} presentation="card" framed expanded/>)}
          </div>}
        </div>
        {fields.length > 0 && <section className="@container space-y-4" aria-labelledby="product-specifications-heading">
          <h2 id="product-specifications-heading" className="text-card-title">Характеристики</h2>
          <CatalogPositionFields fields={fields}/>
          {category.slug === "shveller" && <ChannelSpecificationNote/>}
        </section>}
      </div>
      <Link href={`/catalog/${category.slug}#variant-${variant.id}`} className="inline-flex min-h-11 w-fit items-center rounded-sm font-semibold text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:text-brand-300">
        Вернуться к позиции в каталоге
      </Link>
    </div>
  </PageContainer>;
}
