import type {ProductVariant} from "@/types/product";
import {comparePrices, parseCatalogPrice} from "./catalogFilters";
import {getVariantAttribute, type VariantFilterKey} from "./variantPresentation";
import {getSheetDesignation, isIllustratedSheet, isPlainHotRolledSheet, sheetFormatLabel} from "./sheetPresentation";
import {requiresOfferConfirmation} from "./catalogOffer";

export type VariantSort = "relevance" | "availability" | "price-asc" | "price-desc" | "size" | "name";
export const referenceCategorySlugs = ["shveller", "ugolok", "kvadrat"] as const;

export function referenceProfileName(name: string, categorySlug: string) {
  if (categorySlug === "shveller") {
    const number = name.match(/№\s*(\d+(?:[.,]\d+)?)/)?.[1];
    return number ? `№ ${number.replace(".", ",")}` : name;
  }
  if (categorySlug === "ugolok") return name.replace(/^Уголок (?:металлический|стальной)\s*/i, "");
  if (categorySlug === "kvadrat") return name.replace(/^Квадрат стальной\s*/i, "").replace(/^№\s*/u, "№ ");
  return name;
}

export function uniqueAttributeValues(variants: ProductVariant[], key: VariantFilterKey) {
  return [...new Set(variants.map(variant => getVariantAttribute(variant, key)).filter(value => value !== "—"))]
    .sort((left, right) => left.localeCompare(right, "ru", {numeric: true}));
}

export function variantFilterLabel(variants: ProductVariant[], key: VariantFilterKey) {
  if (key === "angleType") return "Тип уголка";
  if (key === "size" && variants.length > 0 && variants.every(isIllustratedSheet)) return sheetFormatLabel;
  const category = variants[0]?.categoryId;
  if (category === "catalog-cat-ugolok") {
    if (key === "size") return "Ширина полок, мм";
    if (key === "wallThickness") return "Толщина полок, мм";
    if (key === "length") return "Длина, м";
  }
  if (category === "catalog-cat-kvadrat" || category === "catalog-cat-shveller") {
    if (key === "size") return category === "catalog-cat-shveller" ? "Номер профиля" : "Сечение";
    if (key === "length") return "Длина по каталогу";
  }
  return variants.flatMap(variant => variant.attributes).find(attribute => attribute.key === key)?.label ?? key;
}

export function selectVariants(variants: ProductVariant[], options: {
  filters: Partial<Record<VariantFilterKey, string>>;
  filterKeys: readonly VariantFilterKey[];
  stockOnly: boolean;
  minimumPrice: string;
  maximumPrice: string;
  sort: VariantSort;
}) {
  const minimum = parseCatalogPrice(options.minimumPrice);
  const maximum = parseCatalogPrice(options.maximumPrice);
  return variants.filter(variant => options.filterKeys.every(key => !options.filters[key] || getVariantAttribute(variant, key) === options.filters[key])
    && (!options.stockOnly || variant.inStock)
    && (minimum === null || (!requiresOfferConfirmation(variant) && !variant.quoteOnly && variant.price !== null && variant.price >= minimum))
    && (maximum === null || (!requiresOfferConfirmation(variant) && !variant.quoteOnly && variant.price !== null && variant.price <= maximum)))
    .sort((left, right) => {
      if (options.sort === "relevance") return 0;
      if (options.sort === "name") return sortDesignation(left).localeCompare(sortDesignation(right), "ru", {numeric: true});
      if (options.sort === "price-asc" || options.sort === "price-desc") return comparePrices(left.quoteOnly || requiresOfferConfirmation(left) ? null : left.price, right.quoteOnly || requiresOfferConfirmation(right) ? null : right.price, options.sort === "price-desc");
      if (options.sort === "size") return sortSize(left).localeCompare(sortSize(right), "ru", {numeric: true});
      return Number(right.inStock) - Number(left.inStock);
    });
}

function sortDesignation(variant: ProductVariant) {
  if (variant.categoryId === "catalog-cat-ugolok") return sortSize(variant);
  return isPlainHotRolledSheet(variant) ? getSheetDesignation(variant) : variant.name;
}

function sortSize(variant: ProductVariant) {
  if (variant.categoryId === "catalog-cat-ugolok") {
    const section = variant.attributes.find(({key}) => key === "size")?.value;
    if (section) return `${section} ${variant.lengthMeters ?? ""}`;
  }
  return getVariantAttribute(variant, "size");
}
