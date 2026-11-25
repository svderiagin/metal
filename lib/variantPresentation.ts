import type {ProductAttributeKey, ProductVariant} from "@/types/product";
import {getAngleProductSpecifications} from "./anglePresentation";
import {getSquareProductParameters} from "./squarePresentation";
import {getSheetParameters} from "./sheetPresentation";

export type VariantFilterKey = ProductAttributeKey | "angleType" | "width" | "picketProfile" | "picketColor" | "picketPaint";

const defaultFilterKeys: VariantFilterKey[] = ["material", "standard", "size", "grade", "length"];
const filterKeysByCategory: Record<string, VariantFilterKey[]> = {
  armatura: ["material", "standard", "size", "class", "grade", "length"],
  "setka-metallicheskaya": ["material", "size", "wallThickness", "length"],
  kvadrat: ["size", "length"],
  polosa: ["width", "wallThickness", "length"],
  shveller: ["size", "length"],
  shtaketnik: ["picketProfile", "width", "wallThickness", "length", "picketColor", "picketPaint"],
  ugolok: ["angleType", "size", "wallThickness", "length"],
};

const picketFilterSpecifications: Partial<Record<VariantFilterKey, string>> = {
  picketProfile: "Вид профиля штакетника",
  width: "Ширина",
  wallThickness: "Толщина",
  length: "Длина",
  picketColor: "Код цвета",
  picketPaint: "Тип покраски",
};

export function getVariantFilterKeys(categorySlug: string) {
  return filterKeysByCategory[categorySlug] ?? defaultFilterKeys;
}

export function getVariantAttribute(
  variant: ProductVariant,
  key: VariantFilterKey,
) {
  if (variant.categoryId === "catalog-cat-shtaketnik") {
    const name = picketFilterSpecifications[key];
    if (name) {
      const value = specification(variant, [name]);
      if (key === "picketColor") return value.match(/\b\d{4}\b/u)?.[0] ?? value;
      if (key === "picketPaint") {
        if (value === "Односторонний") return "1 сторона";
        if (value === "Двусторонний" || value === "Двухсторонний") return "2 стороны";
      }
      return value.replace(/\s*(?:мм|м)$/u, "");
    }
  }
  if (variant.categoryId === "catalog-cat-shveller") {
    if (key === "size") return variant.name.match(/№\s*(\d+(?:[.,]\d+)?)/)?.[1].replace(".", ",") ?? "—";
    if (key === "length") return specification(variant, ["Длина по каталогу", "Длина", "Размер"]);
  }
  if (variant.categoryId === "catalog-cat-ugolok") {
    if (key === "angleType") return getAngleProductSpecifications(variant).find(({name}) => name === "Тип уголка")?.value ?? "—";
    if (key === "size") return specification(variant, ["Размеры уголка"]);
    if (key === "length") return specification(variant, ["Длина по каталогу", "Длина", "Размер"]);
  }
  if (variant.categoryId === "catalog-cat-kvadrat" && (key === "size" || key === "length")) {
    const square = getSquareProductParameters(variant);
    if (square) return key === "size" ? square.section : square.length;
  }
  if (variant.categoryId === "catalog-cat-polosa") {
    if (key === "width") return specification(variant, ["Ширина"]);
    if (key === "wallThickness") return specification(variant, ["Толщина"]);
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

export function requiresWholeCatalogQuantity(variant: ProductVariant) {
  return variant.id?.startsWith("catalog-") === true && variant.unit === "piece";
}

export function commonQuantityUnit(variants: readonly ProductVariant[]) {
  const first = variants[0];
  if (!first) return undefined;
  const unit = getQuantityUnit(first);
  return variants.every(variant => getQuantityUnit(variant) === unit) ? unit : undefined;
}

export function requiresWholeMetalMeshQuantity(variant: ProductVariant) {
  return variant.categoryId === "cat-mesh" && variant.unit === "piece";
}
