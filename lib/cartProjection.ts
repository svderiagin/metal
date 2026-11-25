import type {ProductVariant} from "@/types/product";
import type {CheckoutProductLabel} from "./checkoutProductLabel";
import {getSheetParameters} from "./sheetPresentation";

// The cart reuses the same pricing validators, but never displays these presentation fields.
const presentationFields = new Set([
  "description", "shortDescription", "attributes", "specifications", "imageUrls",
  "sourceProductName", "material", "standard",
]);

export type CartProductData = Omit<ProductVariant,
  "description" | "shortDescription" | "attributes" | "specifications" | "imageUrls"
  | "sourceProductName" | "material" | "standard"> & {checkoutLabel?: CheckoutProductLabel; sheetFormat?: string};

export function projectCartProduct(product: ProductVariant): CartProductData {
  const projected = Object.fromEntries(Object.entries(product).filter(([key]) => !presentationFields.has(key))) as CartProductData;
  const sheet = getSheetParameters(product);
  if (sheet) {
    const sizeInName = product.name.match(/(\d+)\s*[×xх]\s*(\d+)\s*мм(?!\p{L})/iu);
    if (sizeInName?.[1] !== sheet.width || sizeInName[2] !== sheet.length) projected.sheetFormat = sheet.format;
  }
  return projected;
}

export function cartPricingVariant(product: CartProductData): ProductVariant & Pick<CartProductData, "checkoutLabel" | "sheetFormat"> {
  return {...product, description: "", shortDescription: "", material: "", standard: "",
    attributes: [], specifications: [], imageUrls: []};
}
