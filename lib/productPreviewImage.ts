import illustrations from "@/data/product-illustrations.json";
import type {ProductVariant} from "@/types/product";
import {beamReferenceMassKg} from "./beam";

type Illustration = {imageUrl: string; photoUrl: string; signature: string; showForDemo?: boolean};
const illustrationByProductId: Partial<Record<string, Illustration>> = illustrations;

export function productIllustrationSignature(product: ProductVariant): string {
  const referenceMass = beamReferenceMassKg(product);
  const input = JSON.stringify([
    product.categoryId, product.productTypeId, product.sku, product.name, product.sourceReference,
    product.diameterMm, product.nominalBoreMm, product.profileWidthMm, product.profileHeightMm,
    product.wallThicknessMm, product.lengthMeters, product.lengthRangeMeters, product.sheetSizeMeters,
    product.weightPerMeterKg, product.weightConfirmed, product.form, product.demo, product.specifications,
    ...(product.categoryId === "cat-arm" ? [product.subcategoryId, product.attributes.find(item => item.key === "class")?.value] : []),
    ...(product.categoryId === "cat-bal" ? [product.standard] : []),
    ...(referenceMass === undefined ? [] : [referenceMass]),
  ]);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index++) {
    hash = Math.imul(hash ^ input.charCodeAt(index), 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function getProductIllustration(product: ProductVariant): Illustration | undefined {
  const illustration = illustrationByProductId[product.id];
  return illustration && illustration.signature === productIllustrationSignature(product)
    ? illustration : undefined;
}
