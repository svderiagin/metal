import type {ProductVariant} from "@/types/product";

// Legacy demo records predate the explicit demo flag. Keep supplier data intact.
const legacyDemoIds = new Set(["prd-012", "prd-073", "prd-074", "prd-087", "prd-088", "prd-089", "prd-090"]);
// Source prices are attached to metres although the offer describes packs/rolls/a fitting.
// A verified sales unit is required before enabling purchase of these records.
const unverifiedUnitIds = new Set(["rozmet-29244", "rozmet-29243", "rozmet-29246", "rozmet-29245", "rozmet-29247", "rozmet-29249", "rozmet-29248", "rozmet-26568"]);

export function isDemonstrationProduct(product: Pick<ProductVariant, "id" | "demo">) {
  return product.demo === true || legacyDemoIds.has(product.id);
}

export function hasUnverifiedSalesUnit(product: Pick<ProductVariant, "id">) {
  return unverifiedUnitIds.has(product.id);
}

export function requiresOfferConfirmation(product: Pick<ProductVariant, "id" | "demo" | "priceConfirmed">) {
  return (isDemonstrationProduct(product) && product.priceConfirmed !== true) || hasUnverifiedSalesUnit(product);
}

export function storefrontVariant(product: ProductVariant): ProductVariant {
  if (!requiresOfferConfirmation(product)) return product;
  return {...product, price: null, pricePerTon: undefined, quoteOnly: true};
}
