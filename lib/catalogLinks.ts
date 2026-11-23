import routes from "@/data/direct-catalog-routes.json";

export function catalogProductPath(categorySlug: string, subcategorySlug: string, productTypeSlug: string, variantId?: string) {
  const base = routes.directCategorySlugs.includes(categorySlug)
    ? `/catalog/${categorySlug}`
    : `/catalog/${categorySlug}/${subcategorySlug}/${productTypeSlug}`;
  return variantId ? `${base}#variant-${variantId}` : base;
}
