import type {ProductVariant} from "@/types/product";
import specifications from "@/data/electrowelded-galvanized-specifications.json";
import massReference from "@/imports/electrowelded-image-template/mass-reference.json";
import {formatNumber} from "./numberFormat";

const assortmentStandard = "ГОСТ 10704-91";
const technicalStandard = "ГОСТ 10705-80";
export const electroweldedPipeStandard = `${assortmentStandard}; ${technicalStandard}`;
const pipeMasses: Partial<Record<string, number>> = massReference.massKgPerMeterBySection;
const intermediatePipeMasses: Partial<Record<string, number>> = massReference.massKgPerMeterByFormula;

export function electroweldedPipeMass(diameterMm: number, wallThicknessMm: number) {
  return pipeMasses[`${diameterMm}x${wallThicknessMm}`];
}

export function electroweldedMarketPipeMass(diameterMm: number, wallThicknessMm: number, standard: string) {
  const mass = electroweldedPipeMass(diameterMm, wallThicknessMm) ?? intermediatePipeMasses[`${diameterMm}x${wallThicknessMm}`];
  // ГОСТ 10706-76 limits sizes below 820 mm to a single longitudinal seam.
  // Table 1 of ГОСТ 10704-91 adds 1% to the theoretical mass of single-seam pipe.
  return mass !== undefined && diameterMm < 820 && standard.includes("10706-76")
    ? Math.round(mass * 101) / 100 : mass;
}

export function normalizeElectroweldedVariant(product: ProductVariant): ProductVariant {
  if (product.categoryId !== "cat-trk" || product.subcategoryId !== "cat-trk-sub-2"
    || !product.imported || product.standard !== "ГОСТ 10704; 10705") return product;

  const fact = (label: string) => product.specifications.find(({name}) => name === label)?.value;
  const sourceProductName = fact("Полное обозначение");
  const diameterMm = supplierNumber(fact("Диаметр, мм"));
  const wallThicknessMm = supplierNumber(fact("Толщина, мм"));
  if (sourceProductName !== product.name || diameterMm === undefined || wallThicknessMm === undefined) return product;
  const weightPerMeterKg = electroweldedPipeMass(diameterMm, wallThicknessMm);
  if (weightPerMeterKg === undefined) return product;

  const lengthMm = supplierNumber(fact("Длина, мм"));
  const range = /\sн\/д\s*\((\d+)\s*[-–]\s*(\d+)\s*м\)/iu.exec(sourceProductName);
  const lengthRangeMeters: ProductVariant["lengthRangeMeters"] = lengthMm === undefined && range
    && Number(range[1]) > 0 && Number(range[1]) < Number(range[2]) ? [Number(range[1]), Number(range[2])] : undefined;
  const lengthMeters = lengthMm === undefined ? undefined : lengthMm / 1000;
  if (lengthMeters === undefined && lengthRangeMeters === undefined) return product;

  const supplierGrade = fact("Марка стали");
  const steelGrade = supplierGrade === "Ст20" ? "20" : supplierGrade;
  const section = `${formatNumber(diameterMm)} × ${formatNumber(wallThicknessMm)}`;
  const length = lengthRangeMeters?.map(formatNumber).join("–") ?? formatNumber(lengthMeters!);
  const lengthNote = lengthMeters === 12 && diameterMm <= 219
    ? diameterMm <= 70
      ? "12 м указаны поставщиком. Вид длины требует подтверждения: для мерной трубы этого диаметра ГОСТ 10704-91 (п. 3) указывает 5–9 м."
      : "12 м указаны поставщиком. Для мерной трубы этот размер длины допускается по согласованию (ГОСТ 10704-91, п. 3)."
    : undefined;
  const shortDescription = `Наружный диаметр ${formatNumber(diameterMm)} мм, стенка ${formatNumber(wallThicknessMm)} мм, длина по каталогу ${length} м.`;
  return {
    ...product,
    name: `Труба электросварная прямошовная ${section}, ${length} м${steelGrade ? `, сталь ${steelGrade}` : ""}`,
    sourceProductName,
    shortDescription,
    description: [
      `Сортамент по предложению поставщика — ${assortmentStandard}, технические условия — ${technicalStandard}.`,
      `Теоретическая масса по таблице 1 ${assortmentStandard} — ${formatNumber(weightPerMeterKg)} кг/м. Пересчёт заказа по длине является расчётным.`,
      lengthNote,
      steelGrade ? `Марка стали ${steelGrade} по данным поставщика.` : "Марка стали уточняется.",
      "Фактические параметры партии подтверждаются документом о качестве.",
    ].filter(Boolean).join(" "),
    standard: electroweldedPipeStandard,
    diameterMm,
    wallThicknessMm,
    ...(lengthMeters === undefined ? {lengthRangeMeters} : {lengthMeters}),
    ...(steelGrade ? {steelGrade} : {}),
    weightPerMeterKg,
    weightConfirmed: true,
    attributes: [
      ...product.attributes.filter(({key}) => !["standard", "size", "length", "grade"].includes(key)),
      {key: "standard", label: "Стандарты по каталогу", value: electroweldedPipeStandard},
      {key: "size", label: "Наружный Ø × стенка, мм", value: section},
      {key: "length", label: "Длина по каталогу, м", value: length},
      ...(steelGrade ? [{key: "grade" as const, label: "Марка стали по каталогу", value: steelGrade}] : []),
    ],
    specifications: [
      {name: "Наружный диаметр, мм", value: formatNumber(diameterMm)},
      {name: "Толщина стенки, мм", value: formatNumber(wallThicknessMm)},
      {name: "Длина по каталогу", value: `${length} м`},
      {name: "Теоретическая масса", value: `${formatNumber(weightPerMeterKg)} кг/м`},
      {name: "Марка стали по каталогу", value: steelGrade ?? "Уточняется"},
      {name: "Сортамент по каталогу", value: assortmentStandard},
      {name: "Технические условия по каталогу", value: technicalStandard},
      {name: "Полное обозначение", value: sourceProductName},
    ],
  };
}

function supplierNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const number = Number(value.replace(/\s/gu, "").replace(",", "."));
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

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
    supplierLengthToleranceMm: specifications.supplierLengthToleranceMm,
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
