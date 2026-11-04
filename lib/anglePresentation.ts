import type {ProductVariant} from "@/types/product";

export function getAngleProductSpecifications(variant: ProductVariant) {
  if (variant.categoryId !== "rozmet-cat-ugolok") return variant.specifications;
  const section = variant.specifications.find(item => item.name === "Размеры уголка")?.value.match(/^(\d+)[хx×](\d+)$/u);
  if (!section || Number(section[1]) <= 0 || Number(section[2]) <= 0) return variant.specifications;
  const type = Number(section[1]) === Number(section[2]) ? "Равнополочный" : "Неравнополочный";
  return variant.specifications.map(item => item.name === "Тип уголка" ? {...item, value: type} : item);
}

export function formatAngleSpecificationValue(value: string): string {
  return value
    .replace(/(\d)\.(?=\d)/g, "$1,")
    .replaceAll("кг/м.п.", "кг/м")
    .replace(/\s+(мм|м|кг\/м)$/u, "\u00a0$1");
}
