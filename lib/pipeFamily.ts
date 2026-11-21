import type {ProductVariant} from "@/types/product";

export function isVgpVariant(product: ProductVariant): boolean {
  return product.categoryId === "cat-trk" && ["cat-trk-sub-1", "cat-trk-sub-3"].includes(product.subcategoryId);
}

export function isGalvanizedElectroweldedVariant(product: ProductVariant): boolean {
  return product.categoryId === "cat-trk" && product.subcategoryId === "cat-trk-sub-4";
}

export function isMeasuredElectroweldedVariant(product: ProductVariant): boolean {
  return product.categoryId === "cat-trk"
    && ["cat-trk-sub-2", "cat-trk-sub-4"].includes(product.subcategoryId)
    && product.diameterMm !== undefined && product.wallThicknessMm !== undefined
    && product.weightPerMeterKg !== undefined;
}

export function isWholePipeVariant(product: ProductVariant): boolean {
  return isVgpVariant(product) || isGalvanizedElectroweldedVariant(product);
}
