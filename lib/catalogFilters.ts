import type {ProductVariant} from "@/types/product";
import {getVariantAttribute} from "./variantPresentation";

export function matchesCategoryFilters(variant: ProductVariant, material: string, standard: string, stockOnly: boolean) {
  return (!material || getVariantAttribute(variant, "material") === material)
    && (!standard || getVariantAttribute(variant, "standard") === standard)
    && (!stockOnly || variant.inStock);
}

// Unknown prices always follow known prices, in either sort direction.
export function comparePrices(left: number | null | undefined, right: number | null | undefined, descending = false) {
  if (left == null) return right == null ? 0 : 1;
  if (right == null) return -1;
  return descending ? right - left : left - right;
}
