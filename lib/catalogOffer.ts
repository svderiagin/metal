import type {ProductVariant} from "@/types/product";

// Legacy demo records predate the explicit demo flag. Keep supplier data intact.
const legacyDemoIds = new Set(["prd-012", "prd-073", "prd-074", "prd-087", "prd-088", "prd-089", "prd-090"]);

export function isDemonstrationProduct(product: Pick<ProductVariant, "id" | "demo">) {
  return product.demo === true || legacyDemoIds.has(product.id);
}

export function requiresOfferConfirmation(product: Pick<ProductVariant, "id" | "demo" | "priceConfirmed">) {
  return isDemonstrationProduct(product) && product.priceConfirmed !== true;
}

export function storefrontVariant(product: ProductVariant): ProductVariant {
  if (!requiresOfferConfirmation(product)) return product;
  return {...product, price: null, pricePerTon: undefined, quoteOnly: true};
}
