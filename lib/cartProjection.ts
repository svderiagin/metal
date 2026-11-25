import type {ProductVariant} from "@/types/product";
import type {CheckoutProductLabel} from "./checkoutProductLabel";

// The cart reuses the same pricing validators, but never displays these presentation fields.
const presentationFields = new Set([
  "description", "shortDescription", "attributes", "specifications", "imageUrls",
  "sourceProductName", "material", "standard",
]);

export type CartProductData = Omit<ProductVariant,
  "description" | "shortDescription" | "attributes" | "specifications" | "imageUrls"
  | "sourceProductName" | "material" | "standard"> & {checkoutLabel?: CheckoutProductLabel};

export function projectCartProduct(product: ProductVariant): CartProductData {
  return Object.fromEntries(Object.entries(product).filter(([key]) => !presentationFields.has(key))) as CartProductData;
}

export function cartPricingVariant(product: CartProductData): ProductVariant & Pick<CartProductData, "checkoutLabel"> {
  return {...product, description: "", shortDescription: "", material: "", standard: "",
    attributes: [], specifications: [], imageUrls: []};
}
