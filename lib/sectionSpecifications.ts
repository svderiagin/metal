import type {ProductVariant} from "@/types/product";
import verified from "@/data/section-specifications.json";

const format = (value: number) => value.toLocaleString("ru-RU", {maximumFractionDigits: 3});

// Apply audited facts only to the saved supplier identity. Keep import evidence
// and commercial terms intact; a reference assortment is not a batch certificate.
export function applySectionSpecifications(product: ProductVariant): ProductVariant {
  const record = verified.products[product.id as keyof typeof verified.products];
  if (!record || record.categoryId !== product.categoryId || record.sourceUrl !== product.sourceReference
    || record.sourceProductName !== product.name) return product;
  const [minimum, maximum] = record.lengthRangeMeters;
  const length = minimum === maximum ? `${format(minimum)} м` : `${format(minimum)}–${format(maximum)} м`;
  const mass = `${format(record.displayMassKgPerMeter)} кг/м`;
  const dimensions = record.section.split("x").map(Number);
  const angle = product.categoryId === "rozmet-cat-ugolok";
  const square = product.categoryId === "rozmet-cat-kvadrat";
  const section = square ? `${dimensions[0]}×${dimensions[0]} мм`
    : angle ? `${dimensions.join("×")} мм` : record.section.replace(".", ",");
  const type = dimensions[0] === dimensions[1] ? "Равнополочный" : "Неравнополочный";
  const summary = angle
    ? `${type} стальной уголок с полками ${dimensions[0]} и ${dimensions[1]} мм, толщиной ${dimensions[2]} мм.`
    : square ? `Стальной квадрат сечением ${section}.`
    : `Стальной швеллер № ${section}.`;
  const shortDescription = `${summary} Длина по каталогу ${length}.`;
  const description = `${shortDescription}\n\nНоминальные размеры и теоретическая масса сверены по ${record.referenceStandard}. Масса 1 м — ${format(record.theoreticalMassKgPerMeter)} кг/м при плотности стали 7 850 кг/м³.${!angle && !square ? " Серия У или П уточняется при заказе." : ""}\n\nМарку стали, стандарт поставки и фактические параметры партии подтверждают документами поставщика.`;
  const specs = product.specifications.filter(s => !["Размер", "Вес", "Длина по каталогу", "Справочный сортамент",
    ...(square ? ["Сечение", "Теоретическая масса"] : [])].includes(s.name))
    .map(s => s.name === "Тип уголка" ? {...s, value: type} : s.name === "Теоретическая масса" && angle ? {...s, value: mass} : s);
  if (square) specs.unshift({name: "Сечение", value: section}, {name: "Теоретическая масса", value: mass});
  specs.push({name: "Длина по каталогу", value: length}, {name: "Справочный сортамент", value: record.referenceStandard});
  return {
    ...product, shortDescription, description,
    weightPerMeterKg: record.theoreticalMassKgPerMeter, weightConfirmed: true,
    lengthMeters: minimum === maximum ? minimum : undefined,
    lengthRangeMeters: minimum === maximum ? undefined : [minimum, maximum],
    attributes: [...product.attributes.filter(a => a.key !== "size" && a.key !== "length"),
      {key: "size", label: angle || square ? "Сечение" : "Номер профиля", value: section},
      {key: "length", label: "Длина по каталогу", value: length}],
    specifications: specs,
  };
}
