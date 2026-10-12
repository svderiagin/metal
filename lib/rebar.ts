import type {ProductVariant} from "@/types/product";

// GOST 34028-2016, table 1: nominal mass in kg/m.
// https://files.stroyinf.ru/Data2/1/4293746/4293746568.htm
const nominalMasses: Record<number, number> = {
  6: .222, 8: .395, 10: .617, 12: .888, 14: 1.208, 16: 1.578,
  18: 1.998, 20: 2.466, 22: 2.984, 25: 3.853, 28: 4.834, 32: 6.313, 36: 7.990, 40: 9.865,
};

export function normalizeRebarVariant(product: ProductVariant): ProductVariant {
  if (product.categoryId !== "cat-arm") return product;
  const attribute = (key: string) => product.attributes.find(item => item.key === key);
  const diameterSpec = product.specifications.find(item => /диаметр/i.test(item.name));
  const diameterText = diameterSpec?.value ?? attribute("size")?.value.split(":").pop();
  const diameterMm = product.diameterMm ?? parseNumber(diameterText);
  const weightPerMeterKg = product.weightPerMeterKg ?? (diameterMm ? nominalMasses[diameterMm] : undefined);
  const length = attribute("length") ?? product.specifications
    .filter(item => /длина/i.test(item.name))
    .map(item => ({label: item.name, value: item.value}))[0];
  const parsedLength = parseNumber(length?.value);
  const lengthMeters = product.lengthMeters ?? (parsedLength === undefined ? undefined
    : /мм|mm/i.test(`${length?.label} ${length?.value}`) ? parsedLength / 1000 : parsedLength);
  const form = product.form ?? (/бухт|бунт|моток|мотки/i.test(product.name + " " + product.specifications
    .filter(item => /форм/i.test(item.name)).map(item => item.value).join(" ")) ? "coil" : "bar");

  return {
    ...product,
    diameterMm,
    weightPerMeterKg,
    weight: weightPerMeterKg === undefined ? product.weight : {value: weightPerMeterKg, unit: "кг/м"},
    lengthMeters,
    form,
    steelGrade: product.steelGrade ?? attribute("grade")?.value ?? "—",
    pricePerTon: product.pricePerTon ?? (product.unit === "ton" && product.price !== null ? product.price : undefined),
  };
}

function parseNumber(value: string | undefined) {
  if (!value) return undefined;
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(?:\.\d+)?(?:мм|м|mm|m)?$/i.test(normalized)) return undefined;
  const number = Number.parseFloat(normalized);
  return number > 0 && Number.isFinite(number) ? number : undefined;
}
