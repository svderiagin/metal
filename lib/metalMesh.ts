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
  return roll !== "—" ? roll : metalMeshSpecification(variant, "Размер карты");
}
