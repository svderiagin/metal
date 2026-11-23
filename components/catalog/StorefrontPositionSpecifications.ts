import type {ProductVariant} from "@/types/product";
import {isDemonstrationProduct} from "@/lib/catalogOffer";
import {formatNumber} from "@/lib/numberFormat";
import {getAngleProductSpecifications} from "@/lib/anglePresentation";
import {getSquareProductSpecifications} from "@/lib/squarePresentation";
import {getSheetSpecifications} from "@/lib/sheetPresentation";

export function storefrontPositionFields(variant: ProductVariant) {
  if (isDemonstrationProduct(variant)) return [];
  const specifications = variant.categoryId === "catalog-cat-kvadrat" ? getSquareProductSpecifications(variant)
    : variant.categoryId === "catalog-cat-ugolok" ? getAngleProductSpecifications(variant) : getSheetSpecifications(variant);
  const fields = specifications
    .filter(({name}) => !["Полное обозначение", "Условия цены", "Условия оплаты"].includes(name))
    .map(({name, value}) => ({label: name, value: formatSpecification(value)}));
  if (variant.weightConfirmed && variant.weight && !fields.some(({label}) => /масса|вес/i.test(label))) {
    fields.push({label: "Теоретическая масса", value: `${formatNumber(variant.weight.value)} ${variant.weight.unit}`});
  }
  return fields;
}

export function formatSpecification(value: string) {
  return value.replace(/(\d)\.(?=\d)/gu, "$1,").replace(/(?<=\d)\s*[xх×]\s*(?=\d)/giu, " × ")
    .replace(/кг\/м\.п\./gu, "кг/м");
}
