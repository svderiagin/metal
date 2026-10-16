import type {ProductAttributeKey, ProductVariant} from "@/types/product";

const defaultFilterKeys: ProductAttributeKey[] = ["material", "standard", "size", "grade", "length"];
const filterKeysByCategory: Record<string, ProductAttributeKey[]> = {
  armatura: ["material", "standard", "size", "class", "grade", "length"],
  "setka-metallicheskaya": ["material", "size", "wallThickness", "length"],
};

export function getVariantFilterKeys(categorySlug: string) {
  return filterKeysByCategory[categorySlug] ?? defaultFilterKeys;
}

export function getVariantAttribute(
  variant: ProductVariant,
  key: ProductAttributeKey,
) {
  return variant.attributes.find((attribute) => attribute.key === key)?.value ?? "—";
}

export function getQuantityUnit(variant: ProductVariant) {
  if (variant.unit === "meter") return "м";
  if (variant.unit === "ton") return "т";
  if (variant.unit === "sheet") return "лист";
  if (variant.unit === "kg") return "кг";
  if (variant.priceUnit.toLocaleLowerCase("ru").includes("рулон")) return "рул.";
  return "шт.";
}

export function requiresWholeMetalMeshQuantity(variant: ProductVariant) {
  return variant.categoryId === "cat-mesh" && variant.unit === "piece";
}
