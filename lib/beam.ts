import type {ProductVariant} from "@/types/product";

// Nominal kg/m, GOST 35087-2024 table 1. Only used when this assortment standard is specified.
// https://meganorm.ru/mega_doc/norm_update_04112024/gost_gosudarstvennyj-standart/0/gost_35087-2024_mezhgosudarstvennyy_standart_dvutavry.html
const masses35087: Record<string, number> = {
  "20Б1": 21.3, "20Б2": 25.3, "25Б1": 25.7, "25Б2": 29.6,
  "30Б1": 32, "30Б2": 36.7, "35Б1": 41.4, "35Б2": 49.6,
  "40Б1": 56.6, "40Б2": 66, "45Б1": 66.2,
  "20Ш1": 30.6, "20Ш2": 38.8, "25Ш1": 44.2, "25Ш2": 53.8,
  "30Ш1": 56.8, "30Ш2": 68.6, "35Ш1": 65.3, "35Ш2": 79.7,
  "40Ш1": 88.6, "40Ш2": 106.7, "45Ш1": 123.6,
  "20К1": 41.4, "20К2": 49.9, "25К2": 72.4, "30К1": 87, "30К2": 94,
};
// GOST 19425-74 table 1: beams for suspended tracks.
// https://files.stroyinf.ru/Data2/1/4294852/4294852659.htm
const masses19425: Record<string, number> = {"24М": 38.3, "30М": 50.2, "36М": 57.9, "45М": 77.6};

export function beamProfile(product: ProductVariant) {
  return product.name.match(/(?:^|\s)(\d+(?:[.,]\d+)?[БШКМ]\d*)(?=[хx×\s]|$)/iu)?.[1].toUpperCase()
    ?? product.attributes.find(item => item.key === "size")?.value ?? "—";
}

export function beamKind(product: ProductVariant) {
  const profile = beamProfile(product);
  if (/Ш|широкополоч/i.test(profile + product.name)) return "Широкополочная";
  if (/К\d|колонн/i.test(profile + product.name)) return "Колонная";
  if (/М$/.test(profile)) return "Монорельсовая";
  return "Нормальная";
}

export function normalizeBeamVariant(product: ProductVariant): ProductVariant {
  if (product.categoryId !== "cat-bal") return product;
  const profile = beamProfile(product);
  // GOST 27772 specifies steel properties, not the beam assortment. Do not guess its mass.
  const nominalMass = /35087/.test(product.standard) ? masses35087[profile]
    : /19425/.test(product.standard) ? masses19425[profile] : undefined;
  const weightPerMeterKg = product.weightPerMeterKg ?? nominalMass;
  const length = product.attributes.find(item => item.key === "length");
  const parsedLength = Number(length?.value.replace(/\s/g, "").replace(",", ".").replace(/(?:мм|м|mm|m)$/i, ""));
  const lengthMeters = product.lengthMeters ?? (Number.isFinite(parsedLength) && parsedLength > 0
    ? /мм|mm/i.test(`${length?.label} ${length?.value}`) ? parsedLength / 1000 : parsedLength : undefined);
  return {
    ...product, weightPerMeterKg, lengthMeters,
    // Discard the illustrative size * 0.24 demo weight assigned by the legacy importer.
    weight: weightPerMeterKg === undefined ? undefined : {value: weightPerMeterKg, unit: "кг/м"},
    steelGrade: product.steelGrade ?? product.attributes.find(item => item.key === "grade")?.value ?? "—",
    pricePerTon: product.pricePerTon ?? (product.unit === "ton" && product.price !== null ? product.price : undefined),
  };
}
