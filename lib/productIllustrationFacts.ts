import type {ProductSpecification, ProductVariant} from "@/types/product";

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

  const flat = /^Полоса №\s*(\d+)[хx×](\d+)$/iu.exec(product.name);
  if (flat) {
    add("Ширина", `${flat[1]} мм`);
    add("Толщина", `${flat[2]} мм`);
  }
  const pile = /^Винтовая свая (\d+)[хx×](\d+),/iu.exec(product.name);
  if (pile) {
    add("Диаметр ствола", `${pile[1]} мм`);
    add("Толщина стенки", `${pile[2]} мм`);
  }
  const outerCap = /^Оголовок винтовой сваи (\d+)[хx×](\d+)$/iu.exec(product.name);
  if (outerCap) add("Размеры по обозначению", `${outerCap[1]} × ${outerCap[2]} мм`);
  const innerCap = /^Оголовок внутренний (\d+)\s*мм \(на сваю (\d+)\s*мм\)$/iu.exec(product.name);
  if (innerCap) {
    add("Размер оголовка", `${innerCap[1]} мм`);
    add("Диаметр сваи", `${innerCap[2]} мм`);
  }
  const cap = /^Заглушка стальная эллиптическая (\d+)[хx×](\d+(?:[.,]\d+)?)/iu.exec(product.name);
  if (cap) {
    add("Наружный диаметр", `${cap[1]} мм`);
    add("Толщина стенки", `${cap[2]} мм`);
  }
  const boreFromName = /[\s(]Ду[\s-]*(\d+)/iu.exec(product.name);
  if (boreFromName) add("Условный проход", `Ду ${boreFromName[1]}`);
  const reinforcement = /^(?:Лягушка|Пэшка) из арматуры (\d+)\s*мм.*?(\d+)\/(\d+)\s*мм$/iu.exec(product.name);
  if (reinforcement) {
    add("Диаметр арматуры", `${reinforcement[1]} мм`);
    add("Габариты по обозначению", `${reinforcement[2]} / ${reinforcement[3]} мм`);
  }
  const reducer = /^Переход стальной\s+(\d+[хx×]\d+(?:[.,]\d+)?(?:[-–]\d+[хx×]\d+(?:[.,]\d+)?)?)$/iu.exec(product.name);
  if (reducer) add("Размеры по обозначению", `${reducer[1].replace(/[-–]/u, " – ")} мм`);
  const hinge = /^Петля (?:гаражная с шаром d|каплевидная)\s*(\d+)[хx×](\d+)\s*мм/iu.exec(product.name);
  if (hinge) {
    add("Диаметр", `${hinge[1]} мм`);
    add("Длина", `${hinge[2]} мм`);
  }
  const chair = /^Фиксатор арматуры "Стульчик" (\d+)\s*мм$/iu.exec(product.name);
  if (chair) add("Защитный слой", `${chair[1]} мм`);
  const tieredChair = /^Фиксатор арматуры многоуровневый ([\d, ]+)\s*мм$/iu.exec(product.name);
  if (tieredChair) add("Защитный слой", `${tieredChair[1].trim()} мм`);
  const insulation = /^Пеноплэкс (?:Комфорт|Фундамент) (\d+) мм \((\d+)[хx×](\d+)\), (?:упаковка )?(\d+) лист/iu.exec(product.name);
  if (insulation) {
    add("Толщина", `${insulation[1]} мм`);
    add("Размер плиты", `${insulation[2]} × ${insulation[3]} мм`);
    add("Листов в упаковке", insulation[4]);
  }
  for (const {name, value} of product.specifications) {
    const label = name === "Размер" && (flat || pile) ? "Длина" : displayLabels[name];
    if (!label || (name === "Размер" && (profileWidth || product.diameterMm))
      || (name === "Размер" && (reinforcement || boreFromName || reducer || hinge || chair || tieredChair || insulation))
      || (name === "Диаметр, мм" && product.diameterMm)) continue;
    // Wire's kg/kg value is a sales conversion. Imported weights for piles
    // and fittings can be repeated or conflict across adjacent sizes.
    const repeatedFittingMass = product.categoryId === "rozmet-cat-otvodi" && boreFromName
      && /^2[.,]06\s*кг\s*\/\s*шт/iu.test(value);
    const unverifiedPileMass = product.categoryId === "rozmet-cat-vintovye-svai" && !product.weightConfirmed;
    if (name === "Вес" && (/кг\s*\/\s*кг/iu.test(value) || repeatedFittingMass || unverifiedPileMass)) continue;
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
