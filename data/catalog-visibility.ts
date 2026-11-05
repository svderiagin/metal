// Archived records remain in source data for reproducible imports.
const hiddenProductIds = new Set(["prd-071", "prd-072", "rozmet-26569", "rozmet-28931", "rozmet-28971"]);
const hiddenSkus = new Set(["MS-0071", "MS-0072"]);

export function isPublicProduct(product: {id: string; sku: string}): boolean {
  return !hiddenProductIds.has(product.id) && !hiddenSkus.has(product.sku);
}
