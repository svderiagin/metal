import {notFound, redirect} from "next/navigation";
import {
  getAllProductVariants,
  getCategoryById,
  getCategoryBySlug,
  getProductTypeById,
  getProductVariantBySlug,
  getSubcategoryById,
} from "@/lib/catalog";

type Props = {
  params: Promise<{
    categorySlug: string;
    subcategorySlug: string;
  }>;
};

/**
 * Backward-compatible redirect for the former
 * /catalog/[categorySlug]/[productSlug] product URLs.
 */
export function generateStaticParams() {
  return getAllProductVariants().flatMap((variant) => {
    const category = getCategoryById(variant.categoryId);
    return category
      ? [{categorySlug: category.slug, subcategorySlug: variant.slug}]
      : [];
  });
}

export default async function LegacyProductPage({params}: Props) {
  const {categorySlug, subcategorySlug: legacyProductSlug} = await params;
  const category = getCategoryBySlug(categorySlug);
  const variant = getProductVariantBySlug(legacyProductSlug);
  if (!category || !variant || variant.categoryId !== category.id) notFound();

  const subcategory = getSubcategoryById(variant.subcategoryId);
  const productType = getProductTypeById(variant.productTypeId);
  if (!subcategory || !productType) notFound();

  redirect(
    `/catalog/${category.slug}/${subcategory.slug}/${productType.slug}#variant-${variant.id}`,
  );
}
