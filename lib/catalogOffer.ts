import type {ProductVariant} from "@/types/product";

// Legacy demo records predate the explicit demo flag. Keep supplier data intact.
const legacyDemoIds = new Set(["prd-012", "prd-073", "prd-074", "prd-087", "prd-088", "prd-089", "prd-090"]);

export function isDemonstrationProduct(product: Pick<ProductVariant, "id" | "demo">) {
  return product.demo === true || legacyDemoIds.has(product.id);
}

export function requiresOfferConfirmation(product: Pick<ProductVariant, "id" | "demo" | "priceConfirmed">) {
  return isDemonstrationProduct(product) && product.priceConfirmed !== true;
}

// Use the same availability for the storefront, cart and checkout.
export function storefrontAvailability(availability: ProductVariant["availability"]) {
  return availability === "IN_STOCK" ? "IN_STOCK" : "ON_ORDER";
}

export function storefrontVariant(product: ProductVariant): ProductVariant {
  if (!isDemonstrationProduct(product)) return product;
  const description = product.description.replace(" — оригинальная демонстрационная позиция каталога ООО «РВБ».", ".");
  return requiresOfferConfirmation(product)
    ? {...product, description, price: null, pricePerTon: undefined, quoteOnly: true}
    : {...product, description};
}
