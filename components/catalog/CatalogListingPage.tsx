import type {Category} from "@/types/category";
import type {ProductVariant} from "@/types/product";
import {storefrontProduct} from "@/lib/storefrontProduct";
import type {CatalogGuideSection} from "@/data/catalog-description-copy";
import {PageContainer} from "@/components/layout/PageContainer";
import {Breadcrumbs} from "./Breadcrumbs";
import {CatalogListingNavigation} from "./CatalogListingNavigation";
import {ProductCatalogIntro} from "./ProductCatalogIntro";
import {ProductVariantCatalog} from "./ProductVariantCatalog";
import {CatalogBuyingGuide} from "./CatalogBuyingGuide";

export function CatalogListingPage({category, typeId, title, coverName, label, intro, images, variants, guide}: {
  category: Category;
  typeId?: string;
  title: string;
  coverName?: string;
  label: string;
  intro: string;
  images: string[];
  variants: ProductVariant[];
  guide?: {title: string; description: string | readonly CatalogGuideSection[]};
}) {
  const guideId = typeId ? "product-type-details-heading" : `${category.id}-details-heading`;
  return <PageContainer className="pt-5 pb-8 sm:pt-6 lg:pt-7 lg:pb-10">
    <Breadcrumbs items={[
      {label: "Каталог", href: "/catalog"},
      ...(typeId ? [{label: category.name, href: `/catalog/${category.slug}`}] : []),
      {label: coverName ?? title},
    ]}/>
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-4 lg:gap-5">
        <CatalogListingNavigation category={category} currentTypeId={typeId}/>
        <ProductCatalogIntro key={typeId ?? category.id} title={title} label={label}
          summary={`Позиций: ${variants.length}`} detailsId={guide ? guideId : undefined}
          images={images} description={intro} coverName={coverName}/>
      </div>
      <section id="catalog-products" className="flex scroll-mt-6 flex-col gap-10" aria-label="Подбор и заказ продукции">
        <ProductVariantCatalog variants={variants.map(storefrontProduct)} categorySlug={category.slug}>
          {guide && <CatalogBuyingGuide headingId={guideId} title={guide.title}
            description={guide.description} marginClassName=""/>}
        </ProductVariantCatalog>
      </section>
    </div>
  </PageContainer>;
}
