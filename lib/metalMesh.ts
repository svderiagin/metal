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
  return roll === "—" ? metalMeshSpecification(variant, "Размер карты") : roll;
}

export function metalMeshPackageArea(variant: ProductVariant) {
  const dimensions = metalMeshFormat(variant).match(/^(\d+(?:[.,]\d+)?)\s*[хx×]\s*(\d+(?:[.,]\d+)?)\s*м$/iu);
  return dimensions ? Number(dimensions[1].replace(",", ".")) * Number(dimensions[2].replace(",", ".")) : undefined;
}
