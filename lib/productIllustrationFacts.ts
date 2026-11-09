import type {ProductSpecification, ProductVariant} from "@/types/product";
import {flatSteelDimensions} from "./flatSteel";

const displayLabels: Record<string, string> = {
  "Диаметр": "Диаметр",
  "Номинальный диаметр, мм": "Диаметр",
  "Наружный диаметр, мм": "Наружный диаметр",
  "Диаметр, мм": "Диаметр по каталогу",
  "Условный проход (Ду)": "Условный проход",
  "ДУ": "Условный проход",
  "Толщина металла, мм": "Толщина металла",
  "Толщина стенки, мм": "Толщина стенки",
  "Толщина, мм": "Толщина стенки",
  "Стенка": "Толщина стенки",
  "Толщина": "Толщина",
  "Ширина": "Ширина",
  "Размер": "Размер по каталогу",
  "Размер ячейки": "Ячейка",
  "Диаметр проволоки": "Диаметр проволоки",
  "Размер рулона": "Размер рулона",
  "Размер карты": "Размер карты",
  "Размер листа, м": "Размер листа",
  "Длина": "Длина",
  "Длина, мм": "Длина",
  "Фиксированная длина": "Длина",
  "Длина поставки": "Длина",
  "Форма поставки": "Форма поставки",
  "Марка профиля": "Марка профиля",
  "Цвет / покрытие": "Цвет / покрытие",
  "Покрытие": "Покрытие",
  "Код цвета": "Код цвета",
  "Тип покраски": "Тип покраски",
  "Вид профиля штакетника": "Форма профиля",
  "Вес": "Масса по каталогу",
  "Вес погонного метра": "Масса погонного метра",
};

const format = (value: number) => String(value).replace(".", ",");
const withUnit = (value: string, unit: string) =>
  `${value.replace(new RegExp(`\\s*${unit}$`, "u"), "")} ${unit}`;

export function productIllustrationFacts(product: ProductVariant): ProductSpecification[] {
  const facts = new Map<string, string>();
  function add(name: string, value: string | undefined) {
    const clean = value?.trim().replace(/(\d)\.(?=\d)/gu, "$1,").replace(/\s*[хx×]\s*(?=\d)/giu, " × ");
    if (clean && !/^(?:[-—]+|0|уточняется)$/iu.test(clean) && !facts.has(name)) facts.set(name, clean);
  }
  const profileWidth = product.profileWidthMm;
  const profileHeight = product.profileHeightMm;
  if (profileWidth && profileHeight) add("Сечение", `${format(profileWidth)} × ${format(profileHeight)} мм`);
  if (product.diameterMm) {
    add(product.categoryId === "cat-trk" ? "Наружный диаметр" : "Диаметр", `${format(product.diameterMm)} мм`);
  }
  if (product.nominalBoreMm) add("Условный проход", `Ду ${format(product.nominalBoreMm)}`);
  if (product.wallThicknessMm) {
    add(product.categoryId === "cat-pnf" ? "Толщина металла" : "Толщина стенки", `${format(product.wallThicknessMm)} мм`);
  }

  const flat = flatSteelDimensions(product);
  if (flat) {
    add("Ширина", `${flat.width} мм`);
    add("Толщина", `${flat.thickness} мм`);
  }
  for (const {name, value} of product.specifications) {
    const label = name === "Размер" && flat ? "Длина" : displayLabels[name];
    if (!label || (name === "Размер" && (profileWidth || product.diameterMm))
      || (name === "Диаметр, мм" && product.diameterMm)) continue;
    const unit = name.endsWith(", мм") ? "мм" : name.endsWith(", м") ? "м" : undefined;
    const bore = name === "ДУ" || name === "Условный проход (Ду)";
    const specification = bore && /^\d/u.test(value) ? `Ду ${value}` : value;
    add(label, unit ? withUnit(specification, unit) : specification);
  }
  if (product.lengthMeters && !product.demo) add("Длина", `${format(product.lengthMeters)} м`);
  if (product.weightPerMeterKg && product.weightConfirmed && !product.demo) {
    add("Масса погонного метра", `${format(product.weightPerMeterKg)} кг/м`);
  }
  return Array.from(facts, ([name, value]) => ({name, value})).slice(0, 6);
}
