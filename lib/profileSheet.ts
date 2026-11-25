import type {ProductVariant} from "@/types/product";
import {normalizeText} from "./search/russian";

export type ProfileSheetVariant = ProductVariant & Required<Pick<
  ProductVariant,
  "profileMark" | "sheetSizeMeters" | "wallThicknessMm" | "coatingType"
>>;

export const h75Reference = {
  workingWidthMeters: 0.75,
  overallWidthMm: 800,
  heightMm: 75,
  // ГОСТ 24045-2016, таблица Б.2: справочная масса 1 м длины профиля Н75-750.
  massPerMeter: new Map([[0.7, 7.4], [0.8, 8.4], [0.9, 9.3]]),
};

export function isProfileSheetVariant(variant: ProductVariant): variant is ProfileSheetVariant {
  return variant.categoryId === "cat-pnf"
    && variant.unit === "piece"
    && variant.profileMark !== undefined
    && variant.sheetSizeMeters !== undefined
    && variant.wallThicknessMm !== undefined
    && variant.coatingType !== undefined;
}

export function profileSheetColorLabel(ralCode?: string, colorName?: string) {
  if (!ralCode) return colorName;
  return colorName ? `RAL ${ralCode} · ${colorName}` : `RAL ${ralCode}`;
}

export function profileSheetCoatingLabel(variant: ProfileSheetVariant) {
  return variant.coatingType === "galvanized"
    ? "Цинковое покрытие"
    : profileSheetColorLabel(variant.ralCode, variant.colorName) ?? "Окрашенное покрытие";
}

export function profileSheetDimensions(size: string) {
  const match = /^(\d+(?:[.,]\d+)?)\s*[×xх]\s*(\d+(?:[.,]\d+)?)$/iu.exec(size);
  if (!match) return;
  const width = Number(match[1].replace(",", "."));
  const length = Number(match[2].replace(",", "."));
  if (width > 0 && length > 0 && Number.isFinite(width) && Number.isFinite(length)) {
    return {width, length};
  }
}

export function parseProfileSheetQuery(query: string) {
  const formats: {width: number; length: number}[] = [];
  const measurements: {value: number; millimeters: boolean; label?: string}[] = [];
  const colors: string[] = [];
  // Catalogue formats in metres and workshop notation in millimetres use the same stored dimensions.
  const text = normalizeText(query)
    .replace(/(?<![\p{L}\d.-])(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)(?:\s*(мм|mm|м|m)(?!\p{L}))?(?![\d.x])/gu,
      (_, width: string, length: string, unit?: string) => {
        const scale = unit?.length === 2 || (!unit && Number(width) >= 100) ? 1000 : 1;
        formats.push({width: Number(width) / scale, length: Number(length) / scale});
        return " ";
      })
    .replace(/(?<![\p{L}\d.x-])(?:(толщина|длина|(?:(?:рабочая|габаритная) )?ширина)\s+)?(\d+(?:\.\d+)?)\s*(мм|mm|м|m)(?![\p{L}\d])/gu,
      (_, label: string | undefined, value: string, unit: string) => {
        measurements.push({value: Number(value), millimeters: unit.length === 2, label});
        return " ";
      })
    .replace(/(?<![\p{L}\d])ral\s*(\d{4})(?![\p{L}\d])/gu, (_, code: string) => {
      colors.push(code);
      return " ";
    })
    .replace(/\s+/gu, " ")
    .trim();
  return {
    text,
    matches(variant: ProfileSheetVariant) {
      const size = profileSheetDimensions(variant.sheetSizeMeters);
      return formats.every(format => format.width === size?.width && format.length === size.length)
        && measurements.every(({value, millimeters, label}) => {
          const meters = millimeters ? value / 1000 : value;
          const thickness = millimeters ? value : value * 1000;
          if (label === "толщина") return thickness === variant.wallThicknessMm;
          if (label === "длина") return meters === size?.length;
          if (label === "рабочая ширина" && variant.profileMark !== "Н75"
            || label === "габаритная ширина" && variant.profileMark === "Н75") return false;
          if (label) return meters === size?.width;
          return (millimeters && thickness === variant.wallThicknessMm) || meters === size?.length || meters === size?.width;
        })
        && colors.every(code => code === variant.ralCode);
    },
  };
}
