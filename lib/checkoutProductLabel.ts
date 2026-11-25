import type {ProductVariant} from "@/types/product";
import {beamProfile} from "./beam";
import {channelCategoryId, channelProfile} from "./channel";
import {isMetalMeshVariant, metalMeshFormat, metalMeshSpecification} from "./metalMesh";
import {formatNumber} from "./numberFormat";
import {isVgpVariant} from "./pipeFamily";
import {isProfileSheetVariant, profileSheetCoatingLabel, profileSheetDimensions} from "./profileSheet";
import {getSheetParameters, getTreadPlateExecution} from "./sheetPresentation";
import {getVariantAttribute} from "./variantPresentation";

export interface CheckoutProductLabel {
  title: string;
  titleDetails?: string;
  details?: string;
}

const separator = " · ";
const length = (value: number) => `${formatNumber(value)}\u00a0м`;
const sectionCategories = new Set(["catalog-cat-ugolok", "catalog-cat-kvadrat", "catalog-cat-polosa"]);
const meshNames: Partial<Record<string, string>> = {
  "Штукатурная сетка": "Сетка штукатурная",
  "Плетёная штукатурная сетка": "Сетка штукатурная плетёная",
  "Тканая сетка": "Сетка тканая",
};

function dimensionsLabel(value: string) {
  return value.replace(/(\d)\.(?=\d)/gu, "$1,").replace(/(?<=\d)\s*[×хx]\s*(?=\d)/giu, " × ")
    .replace(/(\d)\s*(мм|м|кг\/лист)$/u, "$1\u00a0$2");
}

function productLength(product: ProductVariant) {
  const value = product.lengthMeters !== undefined ? length(product.lengthMeters)
    : product.lengthRangeMeters ? `${product.lengthRangeMeters.map(formatNumber).join("–")}\u00a0м` : undefined;
  if (value && product.supplierLengthToleranceMm) {
    return `${value} ±${formatNumber(product.supplierLengthToleranceMm)}\u00a0мм`;
  }
  return value;
}

function withDetails(title: string, ...parts: (string | undefined)[]): CheckoutProductLabel {
  return {title, details: parts.filter(part => part && part !== "—").join(separator)};
}

// Generate compact review labels while the full catalog specifications are available.
export function getCheckoutProductLabel(product: ProductVariant, typeName: string | undefined, sharedName: boolean): CheckoutProductLabel | undefined {
  if (isProfileSheetVariant(product)) {
    const size = profileSheetDimensions(product.sheetSizeMeters);
    if (size) {
      const galvanized = product.coatingType === "galvanized";
      const dimensions = product.profileMark === "Н75"
        ? `длина ${length(size.length)}${separator}рабочая ширина ${length(size.width)}`
        : `${formatNumber(size.width)} × ${length(size.length)}`;
      const details = [`${formatNumber(product.wallThicknessMm)}\u00a0мм`, dimensions];
      if (!galvanized) details.push(profileSheetCoatingLabel(product));
      return {
        title: `Профнастил ${product.profileMark}${galvanized ? " оцинкованный" : ""}`,
        details: details.join(separator),
      };
    }
  }

  if (!typeName) return;
  const stockLength = productLength(product);
  const specifiedLength = stockLength ? `длина ${stockLength}` : undefined;

  if (product.categoryId === channelCategoryId || product.categoryId === "cat-bal") {
    const channel = product.categoryId === channelCategoryId;
    const profile = channel ? channelProfile(product) : beamProfile(product);
    if (profile && profile !== "—") {
      return {title: `${channel ? "Швеллер" : "Балка"} ${profile}`,
        titleDetails: [product.steelGrade, stockLength].filter(Boolean).join(", ")};
    }
  }

  if (product.categoryId === "cat-trk" && product.wallThicknessMm) {
    const wall = `${formatNumber(product.wallThicknessMm)}\u00a0мм`;
    if (isVgpVariant(product) && product.nominalBoreMm) {
      const name = product.subcategoryId === "cat-trk-sub-3" ? "Труба ВГП оцинкованная" : "Труба ВГП";
      return withDetails(`${name} Ду\u00a0${formatNumber(product.nominalBoreMm)} × ${wall}`, specifiedLength, product.steelGrade);
    }
    if (product.diameterMm) {
      const grade = product.steelGrade;
      return withDetails(`${typeName} Ø${formatNumber(product.diameterMm)} × ${wall}`,
        specifiedLength, grade && /^\d+$/u.test(grade) ? `сталь ${grade}` : grade);
    }
  }

  if (product.categoryId === "cat-trp" && product.profileWidthMm && product.profileHeightMm && product.wallThicknessMm) {
    const section = [product.profileWidthMm, product.profileHeightMm, product.wallThicknessMm].map(formatNumber).join(" × ");
    return withDetails(`Труба профильная ${section}\u00a0мм`, specifiedLength, product.steelGrade);
  }

  if (product.categoryId === "cat-arm" && product.diameterMm && product.form) {
    const barLength = product.form === "bar" && product.lengthMeters ? `Пруток ${length(product.lengthMeters)}` : undefined;
    if (product.form === "coil" || barLength) {
      const standard = product.name.match(/ГОСТ\s+\d+(?:[-–]\d+)?/u)?.[0];
      return withDetails(`${typeName} Ø${formatNumber(product.diameterMm)}\u00a0мм`, barLength ?? "В бунтах", standard);
    }
  }

  if (sectionCategories.has(product.categoryId)) {
    const size = product.attributes.find(item => item.key === "size")?.value;
    if (size) {
      return withDetails(`${typeName} ${dimensionsLabel(size)}`, specifiedLength, product.steelGrade);
    }
  }

  const sheet = getSheetParameters(product);
  if (sheet) {
    const execution = getTreadPlateExecution(product);
    if (execution) return {
      ...withDetails(`${typeName} ${sheet.thickness}\u00a0мм`, dimensionsLabel(sheet.format), product.steelGrade),
      titleDetails: execution,
    };
    const mass = sharedName && sheet.mass ? dimensionsLabel(sheet.mass.replace(/кг\/шт\.?$/u, "кг/лист")) : undefined;
    return withDetails(`${typeName} ${sheet.thickness}\u00a0мм`, dimensionsLabel(sheet.format), product.steelGrade,
      mass, sharedName ? product.standard : undefined);
  }

  if (isMetalMeshVariant(product)) {
    const cell = metalMeshSpecification(product, "Размер ячейки");
    if (cell !== "—") {
      const name = meshNames[metalMeshSpecification(product, "Тип")] ?? typeName;
      const wire = metalMeshSpecification(product, "Диаметр проволоки");
      const coating = metalMeshSpecification(product, "Покрытие");
      const format = metalMeshFormat(product);
      const packageName = metalMeshSpecification(product, "Размер карты") === "—" ? "рулон" : "карта";
      return withDetails(`${name} ${dimensionsLabel(cell)}`,
        wire === "—" ? undefined : `Ø${dimensionsLabel(wire)}`, coating === "—" ? undefined : coating.toLowerCase(),
        format === "—" ? undefined : `${packageName} ${dimensionsLabel(format)}`);
    }
  }

  if (product.categoryId === "catalog-cat-shtaketnik") {
    const profile = getVariantAttribute(product, "picketProfile");
    const color = getVariantAttribute(product, "picketColor");
    if (profile !== "—" && color !== "—") {
      const name = profile === "Полукруглый" ? "полукруглый" : profile;
      const width = getVariantAttribute(product, "width");
      const thickness = getVariantAttribute(product, "wallThickness");
      const picketLength = getVariantAttribute(product, "length");
      const paint = getVariantAttribute(product, "picketPaint");
      const paintLabel = paint === "1 сторона" ? "односторонняя окраска" : paint === "2 стороны" ? "двусторонняя окраска" : undefined;
      return withDetails(`Штакетник ${name}, RAL\u00a0${color}`,
        width !== "—" && thickness !== "—" ? `${width} × ${thickness}\u00a0мм` : undefined,
        picketLength === "—" ? undefined : `длина ${picketLength}\u00a0м`,
        paintLabel);
    }
  }
}
