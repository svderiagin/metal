import type {ProductAttributeKey, ProductVariant} from "@/types/product";

export const treadPlateSubcategoryId = "catalog-sub-listovoy-prokat-list-riflennyj";
export const galvanizedSheetSubcategoryId = "catalog-sub-listovoy-prokat-galvanized-steel-sheet";
export const coldRolledSheetSubcategoryId = "catalog-sub-listovoy-prokat-list-ocynkovannyj";
export const hotRolledSheetSubcategoryId = "catalog-sub-listovoy-prokat-list-goryachekatanyj";
export const treadPlateTitle = "Лист рифлёный";
export const treadPlateStandard = "ГОСТ 8568-77";
export const hotRolledSheetTitle = "Лист горячекатаный";
export const hotRolledSheetSupply = {
  grade: "Ст3сп",
  assortment: "ГОСТ 19903-2015",
  thinSheetStandard: "ГОСТ 16523-97",
  thickSheetStandard: "ГОСТ 14637-2024",
} as const;
export const sheetFilterKeys: ProductAttributeKey[] = ["wallThickness", "size"];
export const sheetFormatLabel = "Размер листа";

const sheetPresentations = new Map<string, {texture: string; detailsTitle: string; intro?: string}>([
  [treadPlateSubcategoryId, {texture: "Рифлёный", detailsTitle: "Подробнее о рифлёном листе"}],
  [galvanizedSheetSubcategoryId, {
    texture: "Гладкий",
    detailsTitle: "Подробнее об оцинкованном листе",
    intro: "Гладкий стальной лист с цинковым покрытием. Сравните толщину, размер и цену за лист.",
  }],
  [coldRolledSheetSubcategoryId, {texture: "Гладкий", detailsTitle: "Подробнее о холоднокатаном листе"}],
  [hotRolledSheetSubcategoryId, {
    texture: "Гладкий",
    detailsTitle: "Подробнее о горячекатаном листе",
    intro: "Гладкие горячекатаные стальные листы. Сравните толщину, исполнение, формат и цену.",
  }],
]);

export function getSheetPresentation(subcategoryId: string) {
  return sheetPresentations.get(subcategoryId);
}

export function isIllustratedSheet(variant: ProductVariant) {
  return sheetPresentations.has(variant.subcategoryId);
}

export function isTreadPlate(variant: ProductVariant) {
  return variant.subcategoryId === treadPlateSubcategoryId;
}

export function getTreadPlatePattern(variant: ProductVariant) {
  return variant.specifications.find(item => item.name === "Рисунок рифления")?.value;
}

export function getTreadPlateExecution(variant: Pick<ProductVariant, "id">) {
  // These two offers share the same thickness, pattern and format.
  if (variant.id === "catalog-28952") return "По ТУ";
  if (variant.id === "catalog-list-rif-3x1250x2500-chechevitsa") return treadPlateStandard;
}

export function isGalvanizedSheet(variant: ProductVariant) {
  return variant.subcategoryId === galvanizedSheetSubcategoryId;
}

export function isColdRolledSheet(variant: ProductVariant) {
  return variant.subcategoryId === coldRolledSheetSubcategoryId;
}

export function isPlainHotRolledSheet(variant: ProductVariant) {
  return variant.subcategoryId === hotRolledSheetSubcategoryId
    && variant.specifications.some(item => item.name === "Текстура листа" && item.value === "Гладкий");
}

function getSheetQualifier(variant: ProductVariant) {
  return variant.name.match(/\s(ТУ|ГОСТ|Ф)(?:\s+рифл[её]ный)?$/u)?.[1];
}

export function getSheetDesignation(variant: ProductVariant) {
  if (isPlainHotRolledSheet(variant)) {
    const thickness = getSheetParameters(variant)?.thickness;
    if (!thickness) return hotRolledSheetTitle;
    return `${hotRolledSheetTitle} ${thickness} мм`;
  }
  if (variant.subcategoryId === hotRolledSheetSubcategoryId) return variant.name;
  return variant.name.replace(/^Лист\s+(?=№)/u, "").replace(/\s(?:рифл[её]ный|оцинкованный)$/u, "");
}

export function getSheetTableDesignation(variant: ProductVariant) {
  const parameters = getSheetParameters(variant);
  if (!parameters) return getSheetDesignation(variant);
  return [`${parameters.thickness} мм`, getSheetQualifier(variant)].filter(Boolean).join(" · ");
}

const sheetMassFormat = new Intl.NumberFormat("ru-RU", {maximumFractionDigits: 2, useGrouping: false});

export function getSheetParameters(variant: ProductVariant) {
  if (!isIllustratedSheet(variant)) return null;
  const thickness = variant.specifications.find(item => item.name === "Толщина")?.value.match(/^(\d+(?:[,.]\d+)?)\s*мм$/u)?.[1];
  const format = variant.specifications.find(item => item.name === "Размер")?.value.match(/^(\d+(?:[,.]\d+)?)\s*[хx×]\s*(\d+(?:[,.]\d+)?)\s*м$/u);
  const mass = variant.specifications.find(item => item.name === "Вес")?.value;
  if (!thickness || !format) return null;
  const width = Math.round(Number(format[1].replace(",", ".")) * 1000).toString();
  const length = Math.round(Number(format[2].replace(",", ".")) * 1000).toString();

  return {
    thickness: thickness.replace(".", ","),
    width,
    length,
    mass: mass?.replace(/^\d+(?:[.,]\d+)?/u, number => sheetMassFormat.format(Number(number.replace(",", "."))))
      .replace(/кг\/(шт\.|м2)$/u, (_, unit) => unit === "м2" ? "кг/м²" : "кг/шт"),
    format: `${width} × ${length} мм`,
  };
}

export function getSheetSpecifications(variant: ProductVariant) {
  const presentation = getSheetPresentation(variant.subcategoryId);
  const parameters = getSheetParameters(variant);
  if (!parameters || !presentation) return variant.specifications;
  const treadPlate = isTreadPlate(variant);
  const hotRolledSheet = isPlainHotRolledSheet(variant);
  const designation = treadPlate ? undefined : getSheetQualifier(variant);
  const massLabel = variant.standard && !(hotRolledSheet && variant.imported) ? "Теоретическая масса"
    : treadPlate ? "Расчётная масса основания" : "Масса по каталогу";
  const additional = variant.specifications.filter(item => !["Толщина", "Размер", "Вес"].includes(item.name)
    && !(treadPlate && item.name === "Рисунок рифления")
    && !(hotRolledSheet && item.name === "Марка стали" && item.value === hotRolledSheetSupply.grade)
    && !(hotRolledSheet && item.name === "Технические условия" && item.value === hotRolledSheetTechnicalStandard(parameters.thickness))
    && !(item.name === "Текстура листа" && item.value === presentation.texture));
  return [
    {name: "Толщина", value: `${parameters.thickness} мм`},
    {name: sheetFormatLabel, value: parameters.format},
    ...(parameters.mass ? [{name: massLabel, value: parameters.mass}] : []),
    ...(treadPlate && variant.sheetOrder && !variant.sheetOrder.kilogramsPerSheet
      ? [{name: "Масса готового листа", value: "Уточняется при заказе"}] : []),
    ...(designation ? [{name: "Исполнение", value: designation}] : []),
    ...additional,
  ];
}

export function hotRolledSheetTechnicalStandard(thickness: string) {
  return Number(thickness.replace(",", ".")) < 4 ? hotRolledSheetSupply.thinSheetStandard : hotRolledSheetSupply.thickSheetStandard;
}
