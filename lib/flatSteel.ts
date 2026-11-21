import type {ProductVariant} from "@/types/product";
import verified from "@/data/flat-steel-specifications.json";

export const flatSteelCategoryId = "rozmet-cat-polosa";
export const flatSteelTitle = "Полоса стальная";

// Accept both the saved supplier designation and the public display name.
export function flatSteelDimensions(product: Pick<ProductVariant, "categoryId" | "name">) {
  if (product.categoryId !== flatSteelCategoryId) return null;
  const dimensions = /^Полоса(?: стальная)?(?: №)?\s+(\d+)\s*[хx×]\s*(\d+)(?:\s*мм)?$/iu.exec(product.name);
  return dimensions ? {width: dimensions[1], thickness: dimensions[2]} : null;
}

export function applyFlatSteelSpecifications(product: ProductVariant): ProductVariant {
  const section = flatSteelDimensions(product);
  if (!section) return product;
  const named = {...product, name: `${flatSteelTitle} ${section.width}×${section.thickness} мм`};
  const record = verified.products[product.id as keyof typeof verified.products];
  if (!record || record.sourceUrl !== product.sourceReference
    || record.widthMm !== Number(section.width) || record.thicknessMm !== Number(section.thickness)) return named;

  const [minimum, maximum] = record.lengthRangeMeters;
  const format = (value: number) => value.toLocaleString("ru-RU", {maximumFractionDigits: 3});
  const length = minimum === maximum ? `${format(minimum)} м` : `${format(minimum)}–${format(maximum)} м`;
  const mass = `${format(record.theoreticalMassKgPerMeter)} кг/м`;
  const shortDescription = `Стальная полоса прямоугольного сечения шириной ${section.width} мм и толщиной ${section.thickness} мм. Длина по каталогу ${length}.`;
  const description = `${shortDescription}\n\nТеоретическая масса 1 м составляет ${mass}. Расчёт выполнен по номинальным размерам сечения при плотности стали 7 850 кг/м³.\n\nПолосу используют для заготовок, накладок, крепёжных деталей и элементов металлоконструкций. Марку стали, способ изготовления и стандарт поставки уточняют по документам на партию.`;
  const technicalNames = new Set(["Размер", "Вес", "Ширина", "Толщина", "Длина", "Длина по каталогу", "Теоретическая масса"]);
  return {
    ...named, shortDescription, description,
    weightPerMeterKg: record.theoreticalMassKgPerMeter, weightConfirmed: true,
    lengthMeters: minimum === maximum ? minimum : undefined,
    lengthRangeMeters: minimum === maximum ? undefined : [minimum, maximum],
    attributes: [
      ...product.attributes.filter(attribute => attribute.key !== "size" && attribute.key !== "length"),
      {key: "size", label: "Сечение", value: `${section.width}×${section.thickness} мм`},
      {key: "length", label: "Длина по каталогу", value: length},
    ],
    specifications: [
      {name: "Ширина", value: `${section.width} мм`},
      {name: "Толщина", value: `${section.thickness} мм`},
      {name: "Длина по каталогу", value: length},
      {name: "Теоретическая масса", value: mass},
      ...product.specifications.filter(item => !technicalNames.has(item.name)),
    ],
  };
}
