import type {ProductAttributeKey, ProductVariant} from "@/types/product";
import {comparePrices} from "./catalogFilters";
import {getVariantAttribute} from "./variantPresentation";
import {getSheetDesignation, isIllustratedSheet, isPlainHotRolledSheet, sheetFormatLabel} from "./sheetPresentation";

export type VariantSort = "relevance" | "availability" | "price-asc" | "price-desc" | "size" | "name";
export const referenceCategorySlugs = ["shveller", "ugolok", "kvadrat"] as const;
export const referenceColumnWidths = [12, 24, 27, 13, 11, 13] as const;

export function referenceProfileName(name: string, categorySlug: string) {
  if (categorySlug === "shveller") {
    const number = name.match(/№\s*(\d+(?:[.,]\d+)?)/)?.[1];
    return number ? `№ ${number.replace(".", ",")}` : name;
  }
  if (categorySlug === "ugolok") return name.replace(/^Уголок (?:металлический|стальной)\s*/i, "");
  if (categorySlug === "kvadrat") return name.replace(/^Квадрат стальной\s*/i, "").replace(/^№\s*/u, "№ ");
  return name;
}

export function uniqueAttributeValues(variants: ProductVariant[], key: ProductAttributeKey) {
  return [...new Set(variants.map(variant => getVariantAttribute(variant, key)).filter(value => value !== "—"))]
    .sort((left, right) => left.localeCompare(right, "ru", {numeric: true}));
}

export function variantFilterLabel(variants: ProductVariant[], key: ProductAttributeKey) {
  if (key === "size" && variants.length > 0 && variants.every(isIllustratedSheet)) return sheetFormatLabel;
  const category = variants[0]?.categoryId;
  if (category === "rozmet-cat-kvadrat" || category === "rozmet-cat-shveller" || category === "rozmet-cat-ugolok") {
    if (key === "size") return category === "rozmet-cat-shveller" ? "Номер профиля" : "Сечение";
    if (key === "length") return "Длина по каталогу";
  }
  return variants.flatMap(variant => variant.attributes).find(attribute => attribute.key === key)?.label ?? key;
}

export function selectVariants(variants: ProductVariant[], options: {
  filters: Partial<Record<ProductAttributeKey, string>>;
  filterKeys: ProductAttributeKey[];
  stockOnly: boolean;
  minimumPrice: string;
  maximumPrice: string;
  sort: VariantSort;
}) {
  const minimum = parsePrice(options.minimumPrice);
  const maximum = parsePrice(options.maximumPrice);
  return variants.filter(variant => options.filterKeys.every(key => !options.filters[key] || getVariantAttribute(variant, key) === options.filters[key])
    && (!options.stockOnly || variant.inStock)
    && (minimum === null || (!variant.quoteOnly && variant.price !== null && variant.price >= minimum))
    && (maximum === null || (!variant.quoteOnly && variant.price !== null && variant.price <= maximum)))
    .sort((left, right) => {
      if (options.sort === "relevance") return 0;
      if (options.sort === "name") return sortDesignation(left).localeCompare(sortDesignation(right), "ru", {numeric: true});
      if (options.sort === "price-asc" || options.sort === "price-desc") return comparePrices(left.quoteOnly ? null : left.price, right.quoteOnly ? null : right.price, options.sort === "price-desc");
      if (options.sort === "size") return getVariantAttribute(left, "size").localeCompare(getVariantAttribute(right, "size"), "ru", {numeric: true});
      return Number(right.inStock) - Number(left.inStock);
    });
}

function sortDesignation(variant: ProductVariant) {
  return isPlainHotRolledSheet(variant) ? getSheetDesignation(variant) : variant.name;
}

function parsePrice(value: string) {
  if (!value.trim()) return null;
  const number = Number(value.replace(",", "."));
  return Number.isFinite(number) && number >= 0 ? number : null;
}
