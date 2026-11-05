import type {ProductAttributeKey, ProductVariant} from "@/types/product";

export const treadPlateSubcategoryId = "rozmet-sub-listovoy-prokat-list-riflennyj";
export const galvanizedSheetSubcategoryId = "rozmet-sub-listovoy-prokat-galvanized-steel-sheet";
export const coldRolledSheetSubcategoryId = "rozmet-sub-listovoy-prokat-list-ocynkovannyj";
export const hotRolledSheetSubcategoryId = "rozmet-sub-listovoy-prokat-list-goryachekatanyj";
export const hotRolledSheetTitle = "Лист горячекатаный";
export const sheetFilterKeys: ProductAttributeKey[] = ["wallThickness", "size"];
export const sheetFormatLabel = "Размер листа";

const sheetPresentations = new Map<string, {texture: string; detailsTitle: string; intro?: string}>([
  [treadPlateSubcategoryId, {texture: "Рифлёный", detailsTitle: "Подробнее о рифлёном листе"}],
  [galvanizedSheetSubcategoryId, {
    texture: "Гладкий",
    detailsTitle: "Подробнее об оцинкованном листе",
    intro: "Гладкий стальной лист с цинковым покрытием. В таблице можно сравнить толщину, массу и цену за лист.",
  }],
  [coldRolledSheetSubcategoryId, {texture: "Гладкий", detailsTitle: "Подробнее о холоднокатаном листе"}],
  [hotRolledSheetSubcategoryId, {
    texture: "Гладкий",
    detailsTitle: "Подробнее о горячекатаном листе",
    intro: "Гладкие горячекатаные стальные листы. В таблице можно сравнить толщину, формат, массу и цену.",
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

function getHotRolledSheetQualifier(variant: ProductVariant) {
  return variant.name.match(/\s(ТУ|ГОСТ)$/u)?.[1];
}

export function getHotRolledSheetNumber(variant: ProductVariant, thickness: string) {
  const qualifier = getHotRolledSheetQualifier(variant);
  return qualifier ? `${thickness} ${qualifier}` : thickness;
}

export function getSheetDesignation(variant: ProductVariant) {
  if (isPlainHotRolledSheet(variant)) {
    const thickness = getSheetParameters(variant)?.thickness;
    if (!thickness) return hotRolledSheetTitle;
    const number = getHotRolledSheetNumber(variant, thickness).replace(" ", "\u00a0");
    return `${hotRolledSheetTitle} №\u00a0${number}`;
  }
  if (variant.subcategoryId === hotRolledSheetSubcategoryId) return variant.name;
  return variant.name.replace(/^Лист\s+(?=№)/u, "").replace(/\s(?:рифл[её]ный|оцинкованный)$/u, "");
}

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
    mass: mass?.replace(/(\d)\.(?=\d)/u, "$1,").replace(/кг\/(шт\.|м2)$/u, (_, unit) => unit === "м2" ? "кг/м²" : "кг/шт"),
    format: `${width} × ${length} мм`,
  };
}

export function getSheetSpecifications(variant: ProductVariant) {
  const presentation = getSheetPresentation(variant.subcategoryId);
  const parameters = getSheetParameters(variant);
  if (!parameters || !presentation) return variant.specifications;
  const designation = isPlainHotRolledSheet(variant) ? getHotRolledSheetQualifier(variant) : undefined;
  const additional = variant.specifications.filter(item => !["Толщина", "Размер", "Вес"].includes(item.name)
    && !(item.name === "Текстура листа" && item.value === presentation.texture));
  return [
    {name: "Толщина", value: `${parameters.thickness} мм`},
    {name: sheetFormatLabel, value: parameters.format},
    ...(parameters.mass ? [{name: "Масса по каталогу", value: parameters.mass}] : []),
    ...(designation ? [{name: "Исполнение", value: designation}] : []),
    ...additional,
  ];
}
