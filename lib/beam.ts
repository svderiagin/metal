import sections from "@/data/beam-sections.json";
import type {ProductVariant} from "@/types/product";
import {isDemonstrationProduct} from "./catalogOffer";

export type BeamSeries = "Б" | "Ш" | "К" | "М";
const subcategoryBySeries: Record<BeamSeries, string> = {
  Б: "cat-bal-sub-1", Ш: "cat-bal-sub-2", К: "cat-bal-sub-3", М: "cat-bal-sub-4",
};

type BeamSection = {height: number; width: number; web: number; flange: number; mass: number};
const beamSections: Readonly<Partial<Record<string, BeamSection>>> = sections;

// These offers specify the steel standard only. Use the nominal profile in the
// calculator without treating it as the supplier's linear mass for checkout.
// The supplier's general reference lists 153 kg/m for 40К1 under СТО АСЧМ 20-93,
// while table 1 of GOST 35087-2024 gives 146.7 kg/m for that designation.
const referenceProfiles: Record<string, string> = {
  "local-67138": "20Б2", "local-65599": "40Б1", "local-83922": "50Б1", "local-69883": "55Б1",
  "local-73573": "20Ш2", "local-69066": "35К1", "local-67139": "40К1",
};

export function beamReferenceMassKg(product: ProductVariant): number | undefined {
  if (product.categoryId !== "cat-bal" || product.weightPerMeterKg !== undefined || product.standard !== "ГОСТ 27772") return undefined;
  const profile = referenceProfiles[product.id];
  return profile && beamProfile(product) === profile ? beamSections[profile]?.mass : undefined;
}

export function beamProfile(product: ProductVariant) {
  const size = product.attributes.find(item => item.key === "size")?.value;
  const extract = (value: string | undefined) => {
    const match = value?.normalize("NFKC").match(/(?:^|\s)(\d+(?:[.,]\d+)?)\s*(Б|B|Ш|SH|К|K|М|M)\s*(\d*)(?=[хx×\s,;()]|$)/iu);
    if (!match) return undefined;
    const series = match[2].toUpperCase().replace(/SH|B|K|M/g, token => ({SH: "Ш", B: "Б", K: "К", M: "М"})[token]!);
    return `${match[1].replace(",", ".")}${series}${match[3]}`;
  };
  return extract(size) ?? extract(product.name) ?? size ?? "—";
}

export function beamSeries(product: ProductVariant): BeamSeries | undefined {
  if (product.categoryId !== "cat-bal") return undefined;
  const match = beamProfile(product).match(/^\d+(?:[.,]\d+)?([БШКМ])\d*$/);
  if (match) return match[1] as BeamSeries;
  // The six original demo rows lack an actual profile code. Preserve their explicit grouping.
  return (Object.keys(subcategoryBySeries) as BeamSeries[]).find(series => subcategoryBySeries[series] === product.subcategoryId);
}

export function beamKind(product: ProductVariant) {
  const series = beamSeries(product);
  return series ? ({Б: "Нормальная", Ш: "Широкополочная", К: "Колонная", М: "Монорельсовая"})[series] : "—";
}

export function beamSection(product: ProductVariant) {
  const series = beamSeries(product);
  if (!series || isDemonstrationProduct(product)) return undefined;
  // ГОСТ 27772 specifies steel properties. Section dimensions depend on the assortment standard.
  const assortment = series === "М" ? /\b19425\b/u : /\b35087\b/u;
  return assortment.test(product.standard) ? beamSections[beamProfile(product)] : undefined;
}

export function beamStandardLabel(product: ProductVariant) {
  return product.standard
    .replace(/(ГОСТ\s+[\d.-]+);\s*(?=\d)/gu, "$1, ГОСТ ")
    .replace(/ГОСТ\s+(?=\d)/gu, "ГОСТ\u00a0");
}

export function beamTableNames(products: ProductVariant[], {compact = false} = {}) {
  const groups = new Map<string, {name: string; products: ProductVariant[]}>();
  for (const product of products) {
    const kind = beamKind(product);
    const profile = beamProfile(product);
    const grade = product.steelGrade;
    const prefix = compact ? "" : `Балка ${kind.toLowerCase()} `;
    const showGrade = !compact && grade && grade !== "—";
    const name = isDemonstrationProduct(product) || kind === "—" || profile === "—" ? product.name
      : `${prefix}${profile}${showGrade ? `, ${grade}` : ""}`;
    const key = compact ? `${name}|${grade ?? ""}|${product.lengthMeters ?? ""}` : name;
    const group = groups.get(key);
    if (group) group.products.push(product);
    else groups.set(key, {name, products: [product]});
  }

  const names = new Map<string, string>();
  for (const {name, products: group} of groups.values()) {
    const standards = new Set(group.map(beamStandardLabel));
    for (const product of group) {
      let title = name;
      if (group.length > 1) {
        title = standards.size === group.length ? `${name} (${beamStandardLabel(product)})` : product.name;
      }
      names.set(product.id, title);
    }
  }
  return names;
}

export function beamSubcategoryId(product: ProductVariant): string | undefined {
  const series = beamSeries(product);
  return series ? subcategoryBySeries[series] : undefined;
}

export function normalizeBeamVariant(product: ProductVariant): ProductVariant {
  if (product.categoryId !== "cat-bal") return product;
  // This legacy placeholder has no actual profile. Its 10 mm dimension and
  // reinforcing-steel GOST 5781 must never be published as beam specifications.
  if (product.id === "prd-012") return {
    ...product, name: "Балка широкополочная — профиль уточняется", standard: "",
    shortDescription: "Широкополочная балка. Профиль, размеры и марка стали уточняются при заказе.",
    description: "Профиль и технические характеристики этой позиции требуют подтверждения поставщика. Размеры, масса, длина и стандарт поставки указываются после выбора конкретного профиля.",
    attributes: product.attributes.filter(a => !["standard", "size", "grade", "length"].includes(a.key)),
    specifications: [{name: "Профиль и характеристики", value: "Требуют подтверждения"}],
    weightPerMeterKg: undefined, weight: undefined, lengthMeters: undefined, steelGrade: undefined,
    pricePerTon: product.pricePerTon ?? (product.unit === "ton" && product.price !== null ? product.price : undefined),
  };
  const weightPerMeterKg = product.weightPerMeterKg ?? beamSection(product)?.mass;
  const length = product.attributes.find(item => item.key === "length");
  const parsedLength = Number(length?.value.replace(/\s/g, "").replace(",", ".").replace(/(?:мм|м|mm|m)$/i, ""));
  const lengthMeters = product.lengthMeters ?? (Number.isFinite(parsedLength) && parsedLength > 0
    ? /мм|mm/i.test(`${length?.label} ${length?.value}`) ? parsedLength / 1000 : parsedLength : undefined);
  const classifiedSubcategory = beamSubcategoryId(product);
  return {
    ...product, weightPerMeterKg, lengthMeters,
    ...(classifiedSubcategory
      ? {subcategoryId: classifiedSubcategory, productTypeId: `type-${classifiedSubcategory}`} : {}),
    // Discard the illustrative size * 0.24 demo weight assigned by the legacy importer.
    weight: weightPerMeterKg === undefined ? undefined : {value: weightPerMeterKg, unit: "кг/м"},
    steelGrade: product.steelGrade ?? product.attributes.find(item => item.key === "grade")?.value ?? "—",
    pricePerTon: product.pricePerTon ?? (product.unit === "ton" && product.price !== null ? product.price : undefined),
  };
}
