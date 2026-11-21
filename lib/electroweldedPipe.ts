import type {ProductVariant} from "@/types/product";
import specifications from "@/data/electrowelded-galvanized-specifications.json";

export function normalizeGalvanizedElectroweldedVariant(product: ProductVariant): ProductVariant {
  if (product.categoryId !== "cat-trk" || product.subcategoryId !== "cat-trk-sub-4"
    || product.id !== specifications.id || product.sku !== specifications.sku
    || (product.sourceProductName ?? product.name) !== specifications.sourceProductName) return product;
  return {
    ...product,
    name: "Труба электросварная оцинкованная 89×3,5×7800",
    sourceProductName: specifications.sourceProductName,
    shortDescription: "Наружный диаметр 89 мм, стенка 3,5 мм, длина по каталогу 7,8 м. Теоретическая масса без цинкового покрытия — 7,38 кг/м.",
    description: "Оцинкованная электросварная прямошовная труба 89×3,5. Сортамент — ГОСТ 10704-91, технические требования — ГОСТ 10705-80. Теоретическая масса стальной трубы по таблице 1 ГОСТ 10704-91 — 7,38 кг/м, без массы цинкового покрытия. Пересчёт длины и массы использует это справочное значение; массу покрытия и фактическую массу партии подтверждает изготовитель. Длина одной трубы по каталогу — 7,8 м, допуск ±150 мм указан поставщиком. Объём заказа округляется вверх до целых труб по номинальной длине.",
    standard: "ГОСТ 10704-91; ГОСТ 10705-80",
    coatingType: "galvanized",
    diameterMm: specifications.diameterMm,
    wallThicknessMm: specifications.wallThicknessMm,
    lengthMeters: specifications.lengthMeters,
    weightPerMeterKg: specifications.weightPerMeterKg,
    weightConfirmed: true,
    attributes: [
      ...product.attributes.filter(a => !["standard", "size", "length", "wallThickness"].includes(a.key)),
      {key: "standard", label: "Стандарт", value: "ГОСТ 10704-91; ГОСТ 10705-80"},
      {key: "size", label: "Наружный Ø × стенка, мм", value: "89×3,5"},
      {key: "length", label: "Длина по каталогу, м", value: "7,8"},
    ],
    specifications: [
      {name: "Наружный диаметр, мм", value: "89"},
      {name: "Толщина стенки, мм", value: "3,5"},
      {name: "Покрытие", value: "Цинковое"},
      {name: "Теоретическая масса без цинкового покрытия", value: "7,38 кг/м"},
      {name: "Длина по каталогу", value: "7,8 м (±150 мм по данным поставщика)"},
      {name: "Стандарт", value: "ГОСТ 10704-91; ГОСТ 10705-80"},
      {name: "Полное обозначение", value: specifications.sourceProductName},
    ],
  };
}
