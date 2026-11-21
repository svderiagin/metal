import type {ProductVariant} from "@/types/product";
import galvanized from "@/data/vgp-galvanized-specifications.json";
import {formatMassPerMeter, formatNumber} from "./numberFormat";

export {isVgpVariant} from "./pipeFamily";
export {wholePipeOrder as wholeVgpOrder} from "./wholePipeOrder";

// Preserve supplier evidence and commercial terms; apply verified dimensions to this offer only.
export function normalizeGalvanizedVgpVariant(product: ProductVariant): ProductVariant {
  if (product.categoryId !== "cat-trk" || product.subcategoryId !== "cat-trk-sub-3"
    || product.id !== galvanized.id || product.sku !== galvanized.sku
    || (product.sourceProductName ?? product.name) !== galvanized.sourceProductName) return product;
  const specifications = [
    {name: "Условный проход (Ду)", value: "25"},
    {name: "Наружный диаметр, мм", value: "33,5"},
    {name: "Толщина стенки, мм", value: "2,8"},
    {name: "Серия по толщине стенки", value: "Лёгкая"},
    {name: "Покрытие", value: "Цинковое"},
    {name: "Теоретическая масса", value: `${formatMassPerMeter(galvanized.weightPerMeterKg)} кг/м`},
    {name: "Длина по каталогу", value: "7,8 м (±150 мм по данным поставщика)"},
    {name: "Стандарт", value: "ГОСТ 3262-75"},
    {name: "Полное обозначение", value: galvanized.sourceProductName},
  ];
  return {
    ...product,
    name: "Труба ВГП оцинкованная Ду25×2,8×7800",
    sourceProductName: galvanized.sourceProductName,
    shortDescription: "Оцинкованная ВГП-труба Ду25, наружный диаметр 33,5 мм, стенка 2,8 мм. Длина по каталогу 7,8 м.",
    description: "Теоретическая масса с учётом цинкового покрытия рассчитана по ГОСТ 3262-75. Допуск ±150 мм указан поставщиком для каталожной длины 7,8 м. Вид длины, фактическую длину и параметры покрытия подтверждают документы поставки.",
    standard: "ГОСТ 3262-75", coatingType: "galvanized",
    nominalBoreMm: galvanized.nominalBoreMm, diameterMm: galvanized.diameterMm,
    wallThicknessMm: galvanized.wallThicknessMm, lengthMeters: galvanized.lengthMeters,
    supplierLengthToleranceMm: galvanized.supplierLengthToleranceMm,
    weightPerMeterKg: galvanized.weightPerMeterKg, weightConfirmed: true,
    attributes: [
      ...product.attributes.filter(a => !["standard", "size", "length", "wallThickness"].includes(a.key)),
      {key: "standard", label: "Стандарт", value: "ГОСТ 3262-75"},
      {key: "size", label: "Ду × стенка, мм", value: "25×2,8"},
      {key: "length", label: "Длина по каталогу, м", value: "7,8"},
    ],
    specifications,
  };
}

export function vgpSize(product: ProductVariant): string {
  if (product.nominalBoreMm === undefined || product.wallThicknessMm === undefined) return "—";
  return `${formatNumber(product.nominalBoreMm)} × ${formatNumber(product.wallThicknessMm)}`;
}

export function vgpSeries(product: ProductVariant): string {
  return product.specifications.find(spec => spec.name === "Серия по толщине стенки")?.value ?? "—";
}
