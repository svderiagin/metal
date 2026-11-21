// Archived records remain in source data for reproducible imports.
const hiddenProductIds = new Set(["prd-071", "prd-072", "prd-073", "prd-074", "rozmet-26569", "rozmet-28931", "rozmet-28971"]);
const hiddenSkus = new Set(["MS-0071", "MS-0072", "MS-0073", "MS-0074"]);

export function isPublicProduct(product: {id: string; sku: string}): boolean {
  return !hiddenProductIds.has(product.id) && !hiddenSkus.has(product.sku);
}
