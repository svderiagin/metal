// Archived demo records stay in their source files, but never enter public queries or imports.
const hiddenProductIds = new Set(["prd-071", "prd-072"]);
const hiddenSkus = new Set(["MS-0071", "MS-0072"]);

export function isPublicProduct(product: {id: string; sku: string}): boolean {
  return !hiddenProductIds.has(product.id) && !hiddenSkus.has(product.sku);
}
