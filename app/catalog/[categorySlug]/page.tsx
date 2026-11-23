import {getCatalogCoverImages} from "@/lib/catalogCoverImages";
import {catalogDescriptionCopy} from "@/data/catalog-description-copy";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {CatalogBuyingGuide} from "@/components/catalog/CatalogBuyingGuide";
import {CatalogListingNavigation} from "@/components/catalog/CatalogListingNavigation";
import {CatalogListingPage} from "@/components/catalog/CatalogListingPage";
import {ProductTypeResults} from "@/components/catalog/ProductTypeResults";
import {ProductCatalogIntro} from "@/components/catalog/ProductCatalogIntro";
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
  return {title: category.name, description: catalogDescriptionCopy[category.id]?.intro ?? category.shortDescription};
}

export default async function CategoryPage({params}: Props) {
  const {categorySlug} = await params;
  const category = getCategoryBySlug(categorySlug);
  if (!category) notFound();
  const productTypes = getProductTypesByCategoryId(category.id);
  const variants = getProductVariantsByCategoryId(category.id);
  const mainImageUrl = category.id === "cat-trp"
    ? "/images/catalog/truby-profilnye/main/truba-main.jpg"
    : category.imageUrl;
  const coverImages = getCatalogCoverImages(category.id,
    category.id === "cat-pnf" || mainImageUrl.endsWith(".svg") ? "" : mainImageUrl);
  const hasImage = coverImages.length > 0;
  const description = catalogDescriptionCopy[category.id] ?? category.descriptionSections;
  const introDescription = description?.intro ?? category.description;
  const detailedDescription = description?.details;

  if (category.directProducts) {
    return <CatalogListingPage category={category} title={category.name} label="Категория"
      intro={introDescription} images={coverImages} variants={variants}
      guide={detailedDescription ? {
        title: description?.title ?? `Как выбрать продукцию категории «${category.name}»`,
        description: detailedDescription,
      } : undefined}/>;
  }

  return (
    <PageContainer className="pt-5 pb-8 sm:pt-6 lg:pt-7 lg:pb-10">
      <Breadcrumbs items={[{label: "Каталог", href: "/catalog"}, {label: category.name}]}/>
      <div className="flex min-w-0 flex-col gap-10">
        <div className="flex min-w-0 flex-col gap-6 lg:gap-8">
          <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
            <CatalogListingNavigation category={category}/>
            <ProductCatalogIntro key={category.id} title={category.name} label="Категория"
              summary={`Типов: ${productTypes.length}`} showProductTypesLink
              detailsId={detailedDescription ? `${category.id}-details-heading` : undefined}
              images={hasImage ? coverImages : []} description={introDescription}/>
          </div>
          <ProductTypeResults productTypes={productTypes} variants={variants}/>
        </div>
        {detailedDescription && <CatalogBuyingGuide headingId={`${category.id}-details-heading`}
          title={description?.title ?? `Как выбрать продукцию категории «${category.name}»`}
          description={detailedDescription} marginClassName=""/>}
        <div className="rounded-xl bg-slate-900 p-5 text-white sm:p-6">
          <h2 className="text-section-title">Нужна комплектация по спецификации?</h2>
          <p className="mt-2 text-slate-300">Опишите позиции и необходимые услуги — подготовим единый расчёт.</p>
          <ButtonLink href="/#request" className="mt-5">Запросить расчёт</ButtonLink>
        </div>
      </div>
    </PageContainer>
  );
}
