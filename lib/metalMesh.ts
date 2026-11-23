import type {ProductVariant} from "@/types/product";

export type MetalMeshVariant = ProductVariant & {categoryId: "cat-mesh"};

export function isMetalMeshVariant(variant: ProductVariant): variant is MetalMeshVariant {
  return variant.categoryId === "cat-mesh";
}

export function metalMeshSpecification(variant: ProductVariant, name: string) {
  return variant.specifications.find((specification) => specification.name === name)?.value ?? "—";
}

export function metalMeshFormat(variant: ProductVariant) {
  const roll = metalMeshSpecification(variant, "Размер рулона");
  if (roll === "—") return metalMeshSpecification(variant, "Размер карты");
  // Some roll specifications give only the length; the product designation also gives the width.
  const length = roll.match(/^(\d+(?:[.,]\d+)?)\s*м\.?$/iu);
  const dimensions = variant.name.match(/рулон\s+(\d+(?:[.,]\d+)?)\s*[хx×]\s*(\d+(?:[.,]\d+)?)(?:\s*м)?\s*[.)]?$/iu);
  if (!length || !dimensions || decimal(dimensions[2]) !== decimal(length[1])) return roll;
  return `${decimal(dimensions[1])}×${decimal(dimensions[2])} м`.replaceAll(".", ",");
}

function decimal(value: string) {
  return Number(value.replace(",", "."));
}
