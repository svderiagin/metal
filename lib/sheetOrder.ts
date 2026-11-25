import type {ProductVariant} from "@/types/product";
import {maxOrderSheets, wholeLengthPieces} from "./orderMeasurement";
import {getSheetParameters, getTreadPlatePattern, isPlainHotRolledSheet, isTreadPlate} from "./sheetPresentation";

type SheetOrder = NonNullable<ProductVariant["sheetOrder"]>;

// ГОСТ 8568-77, чечевичное рифление. Значения в десятых долях кг/м².
const kilogramsPerSquareMeterTenths: Partial<Record<string, number>> = {
  "2,5": 201, "3": 242, "4": 322, "5": 405, "6": 485, "8": 649, "10": 809, "12": 968,
};

export function getSheetOrderParameters(product: ProductVariant): SheetOrder | undefined {
  const treadPlate = isTreadPlate(product) && getTreadPlatePattern(product) === "Чечевица";
  if ((!treadPlate && !isPlainHotRolledSheet(product)) || (product.unit !== "piece" && product.unit !== "square_meter")) return;
  const sheet = getSheetParameters(product);
  if (!sheet) return;
  const areaMm2 = Number(sheet.width) * Number(sheet.length);
  const area = areaMm2 / 1e6;
  if (!Number.isFinite(area) || area <= 0) return;
  const kilogramsPerSheet = treadPlate ? (kilogramsPerSquareMeterTenths[sheet.thickness] ?? 0) * areaMm2 / 1e7
    : getCatalogSheetMass(product, area);
  if (!Number.isFinite(kilogramsPerSheet) || kilogramsPerSheet <= 0) return;
  return {kilogramsPerSheet, quantityPerSheet: product.unit === "square_meter" ? area : 1};
}

function getCatalogSheetMass(product: ProductVariant, areaSquareMeters: number) {
  const catalogMass = product.specifications.find(item => item.name === "Вес")?.value;
  const match = catalogMass?.match(/^(\d+(?:[.,]\d+)?)\s*кг\/(шт\.?|м[²2])$/u);
  if (!match) return 0;
  // Use the catalog value before display rounding, expressed per sheet or per m².
  const value = Number(match[1].replace(",", "."));
  return match[2].startsWith("м") ? value * areaSquareMeters : value;
}

export function sheetOrderTons(order: SheetOrder, sheets: number) {
  return Number((sheets * order.kilogramsPerSheet / 1000).toPrecision(15));
}

export function sheetsForOrderTons(order: SheetOrder, tons: number) {
  return Math.min(maxOrderSheets, wholeLengthPieces(tons, sheetOrderTons(order, 1)));
}

export const sheetTonDecimals = 3;
