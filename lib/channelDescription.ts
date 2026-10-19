import type {ProductVariant} from "@/types/product";

export function getChannelProductDescription(variant: ProductVariant): string {
  if (variant.categoryId !== "rozmet-cat-shveller") return variant.description || variant.shortDescription;

  const formatValue = (value: string) => value.replace(/(\d)\.(?=\d)/g, "$1,")
    .replace(/(\d)\s*-\s*(?=\d)/g, "$1–").replace(/кг\/м\.п\.?/g, "кг/м");
  const specification = (name: string) => variant.specifications.find(item => item.name === name)?.value;
  const parameters = [
    ["высота", specification("Высота")],
    ["ширина полки", specification("Ширина полки") || specification("Ширина")],
    ["толщина стенки", specification("Толщина стенки") || specification("Толщина")],
    ["толщина полки", specification("Толщина полки")],
    ["длина по каталогу", specification("Длина по каталогу") || specification("Длина") || specification("Размер")],
    ["теоретическая масса 1 м", specification("Теоретическая масса") || specification("Вес")],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([label, value]) => `${label} — ${formatValue(value)}`);

  const purpose = `${formatValue(variant.name)} — стальной профиль П-образного сечения для рам, каркасов и опорных элементов при строительстве домов, гаражей и хозяйственных построек.`;
  const selection = "При выборе учитывайте размеры сечения, длину и нагрузки на конструкцию. Для несущих элементов сечение подбирают расчётом.";
  return [purpose, parameters.length ? `Параметры: ${parameters.join("; ")}.` : "", selection].filter(Boolean).join("\n\n");
}
