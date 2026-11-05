import type {ProductAttributeKey, ProductVariant} from "@/types/product";
import {getSquareProductParameters} from "./squarePresentation";
import {getSheetParameters} from "./sheetPresentation";

const defaultFilterKeys: ProductAttributeKey[] = ["material", "standard", "size", "grade", "length"];
const filterKeysByCategory: Record<string, ProductAttributeKey[]> = {
  armatura: ["material", "standard", "size", "class", "grade", "length"],
  "setka-metallicheskaya": ["material", "size", "wallThickness", "length"],
  kvadrat: ["size", "length"],
  shveller: ["size", "length"],
  ugolok: ["size", "wallThickness", "length"],
};

export function getVariantFilterKeys(categorySlug: string) {
  return filterKeysByCategory[categorySlug] ?? defaultFilterKeys;
}

export function getVariantAttribute(
  variant: ProductVariant,
  key: ProductAttributeKey,
) {
  if (variant.categoryId === "rozmet-cat-shveller") {
    if (key === "size") return variant.name.match(/№\s*(\d+(?:[.,]\d+)?)/)?.[1].replace(".", ",") ?? "—";
    if (key === "length") return specification(variant, ["Длина по каталогу", "Длина", "Размер"]);
  }
  if (variant.categoryId === "rozmet-cat-ugolok") {
    if (key === "size") return specification(variant, ["Размеры уголка"]);
    if (key === "length") return specification(variant, ["Длина по каталогу", "Длина", "Размер"]);
  }
  if (variant.categoryId === "rozmet-cat-kvadrat" && (key === "size" || key === "length")) {
    const square = getSquareProductParameters(variant);
    if (square) return key === "size" ? square.section : square.length;
  }
  if (key === "size" || key === "wallThickness") {
    const sheet = getSheetParameters(variant);
    if (sheet) return key === "size" ? sheet.format : `${sheet.thickness} мм`;
  }
  return variant.attributes.find((attribute) => attribute.key === key)?.value ?? "—";
}

function specification(variant: ProductVariant, names: string[]) {
  const value = names.map(name => variant.specifications.find(item => item.name === name)?.value).find(Boolean);
  return value?.replace(/(\d)\.(?=\d)/g, "$1,").replace(/(\d)\s*-\s*(?=\d)/g, "$1–") ?? "—";
}

export function getQuantityUnit(variant: ProductVariant) {
  if (variant.unit === "square_meter") return "м²";
  if (variant.unit === "meter") return "м";
  if (variant.unit === "ton") return "т";
  if (variant.unit === "sheet") return "лист";
  if (variant.unit === "kg") return "кг";
  if (variant.priceUnit.toLocaleLowerCase("ru").includes("рулон")) return "рул.";
  return "шт.";
}

export function requiresWholeRozmetQuantity(variant: ProductVariant) {
  return variant.id?.startsWith("rozmet-") === true && variant.unit === "piece";
}

export function requiresWholeMetalMeshQuantity(variant: ProductVariant) {
  return variant.categoryId === "cat-mesh" && variant.unit === "piece";
}
