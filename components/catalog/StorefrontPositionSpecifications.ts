import type {ProductVariant} from "@/types/product";
import {isDemonstrationProduct} from "@/lib/catalogOffer";
import {formatNumber} from "@/lib/numberFormat";
import {getAngleProductSpecifications} from "@/lib/anglePresentation";
import {getSquareProductSpecifications} from "@/lib/squarePresentation";
import {getSheetSpecifications} from "@/lib/sheetPresentation";

export function storefrontPositionFields(variant: ProductVariant) {
  if (isDemonstrationProduct(variant)) return [];
  const isAngle = variant.categoryId === "catalog-cat-ugolok";
  const specifications = variant.categoryId === "catalog-cat-kvadrat" ? getSquareProductSpecifications(variant)
    : isAngle ? getAngleProductSpecifications(variant) : getSheetSpecifications(variant);
  const fields = specifications
    .filter(({name}) => !["Полное обозначение", "Условия цены", "Условия оплаты"].includes(name)
      && (!isAngle || name !== "Справочный сортамент"))
    .map(({name, value}) => ({
      label: name,
      value: name === "Справочный сортамент" && /^ГОСТ (?:2591-2006|8509-93|8510-86)$/u.test(value)
        ? `${value} (таблица 1)` : formatSpecification(value),
    }));
  if (variant.weightConfirmed && variant.weight && !fields.some(({label}) => /масса|вес/i.test(label))) {
    fields.push({label: "Теоретическая масса", value: `${formatNumber(variant.weight.value)} ${variant.weight.unit}`});
  }
  return fields;
}

export function formatSpecification(value: string) {
  return value.replace(/(\d)\.(?=\d)/gu, "$1,").replace(/(?<=\d)\s*[xх×]\s*(?=\d)/giu, " × ")
    .replace(/кг\/м\.п\./gu, "кг/м");
}
