import {notFound, redirect} from "next/navigation";
import type {Metadata} from "next";
import {Breadcrumbs} from "@/components/catalog/Breadcrumbs";
import {CatalogListingNavigation} from "@/components/catalog/CatalogListingNavigation";
import {CatalogBuyingGuide} from "@/components/catalog/CatalogBuyingGuide";
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
      <PageContainer withBreadcrumbs className="pb-8 lg:pb-10">
        <Breadcrumbs items={[
          {label: "Каталог", href: "/catalog"},
          {label: category.name, href: `/catalog/${category.slug}`},
          {label: currentSubcategory.name},
        ]}/>
        <div className="flex min-w-0 flex-col gap-10">
          <div className="flex min-w-0 flex-col gap-6 lg:gap-8">
            <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
              <CatalogListingNavigation category={category} currentTypeId={productTypes.length === 1 ? productType.id : undefined}/>
              <ProductCatalogIntro key={currentSubcategory.id} title={currentSubcategory.name} label="Подкатегория"
                summary={`Типов: ${productTypes.length}`} showProductTypesLink
                detailsId={copy ? "subcategory-details-heading" : undefined} images={coverImages} description={intro}/>
            </div>
            <ProductTypeResults productTypes={productTypes} variants={variants}/>
          </div>
          {copy && <CatalogBuyingGuide headingId="subcategory-details-heading" title={copy.title} description={copy.details} marginClassName=""/>}
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
