import type {ProductVariant} from "@/types/product";
import {isDemonstrationProduct} from "./catalogOffer";
import {getProductIllustration} from "./productPreviewImage";

export function storefrontProduct(product: ProductVariant): ProductVariant {
  const illustration = getProductIllustration(product);
  const description = product.description.split(/\n\s*\n/u)
    .filter(paragraph => !/https?:\/\/|[\w.+-]+@[\w.-]+\.\w+|(?:\+7|8)[\s()-]*\d{3}[\s()-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/iu.test(paragraph))
    .join("\n\n");
  const result = {...product, description};
  if (illustration && (!isDemonstrationProduct(product) || illustration.showForDemo)) {
    result.imageUrls = [illustration.imageUrl];
  }
  return result;
}
