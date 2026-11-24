import type {ProductVariant} from "@/types/product";
import massReference from "@/imports/electrowelded-image-template/mass-reference.json";
import {formatNumber} from "./numberFormat";

export const electroweldedPipeAssortmentStandard = "ГОСТ 10704-91";
export const electroweldedPipeTechnicalStandard = "ГОСТ 10705-80";
export const electroweldedPipeStandard = `${electroweldedPipeAssortmentStandard}; ${electroweldedPipeTechnicalStandard}`;
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
      `Сортамент по предложению поставщика — ${electroweldedPipeAssortmentStandard}, технические условия — ${electroweldedPipeTechnicalStandard}.`,
      `В таблице 1 ${electroweldedPipeAssortmentStandard} теоретическая масса 1 м трубы составляет ${formatNumber(weightPerMeterKg)} кг. Пересчёт заказа по длине является расчётным.`,
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
      {name: "Сортамент по каталогу", value: electroweldedPipeAssortmentStandard},
      {name: "Технические условия по каталогу", value: electroweldedPipeTechnicalStandard},
      {name: "Полное обозначение", value: sourceProductName},
    ],
  };
}

function supplierNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const number = Number(value.replace(/\s/gu, "").replace(",", "."));
  return Number.isFinite(number) && number > 0 ? number : undefined;
}
