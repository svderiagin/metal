import type {Metadata} from "next";
import {notFound, redirect} from "next/navigation";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {CatalogListingNavigation} from "@/components/catalog/CatalogListingNavigation";
import {CatalogDescription} from "@/components/catalog/CatalogDescription";
import {ProductVariantCatalog} from "@/components/catalog/ProductVariantCatalog";
import {ProductCatalogIntro} from "@/components/catalog/ProductCatalogIntro";
import {getCatalogCoverImages} from "@/lib/catalogCoverImages";
import {catalogDescriptionCopy} from "@/data/catalog-description-copy";
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
    description: catalogDescriptionCopy[productType.subcategoryId]?.intro ?? sheet?.intro ?? productType.shortDescription,
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
  const copy = catalogDescriptionCopy[productType.subcategoryId];
  const title = productType.name;
  const intro = copy?.intro ?? (sheet ? sheet.intro ?? productType.shortDescription : productType.shortDescription);
  const sourceDetails = productType.description.startsWith(productType.shortDescription)
    ? productType.description.slice(productType.shortDescription.length).trim()
    : productType.description;
  const details = copy?.details ?? (sheet ? sourceDetails : "");
  const detailsTitle = copy?.title ?? sheet?.detailsTitle;
  const images = getCatalogCoverImages(productType.id,
    productType.imageUrl && !productType.imageUrl.endsWith(".svg") ? productType.imageUrl : "");

  return (
    <PageContainer className="py-5 sm:py-6 lg:py-7">
      <Breadcrumbs
        items={[
          {label: "Каталог", href: "/catalog"},
          {label: category.name, href: `/catalog/${category.slug}`},
          {label: title},
        ]}
      />

      <div className="flex flex-col gap-4">
        <CatalogListingNavigation category={category} currentTypeId={productType.id}/>
        <ProductCatalogIntro key={productType.id} title={rebarHeadings[productType.subcategoryId] ?? title}
          summary={`Позиций: ${variants.length}`} resultsHref="#catalog-products"
          detailsId={detailsTitle && details ? "product-type-details-heading" : undefined}
          label={sheet || copy ? "Подкатегория" : "Тип продукции"} images={images} description={intro} coverName={title}/>
        <section id="catalog-products" className="flex scroll-mt-6 flex-col gap-5" aria-label="Подбор и заказ продукции">
        <ProductVariantCatalog variants={variants} categorySlug={category.slug}>
          {detailsTitle && details && <section className="min-w-0 max-w-[800px] lg:col-start-2" aria-labelledby="product-type-details-heading">
            <h2 id="product-type-details-heading" className="text-section-title leading-tight">{detailsTitle}</h2>
            <CatalogDescription description={details} variant="categoryDetails" className="mt-4"/>
          </section>}
        </ProductVariantCatalog>
        </section>
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
