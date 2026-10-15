import type {ProductVariant, ProductWeight} from "@/types/product";

export function isPipeProduct(product: {categoryId: string}): boolean {
  return ["cat-trk", "cat-trs", "cat-trn", "cat-trp"].includes(product.categoryId);
}

// Circular steel section at 7850 kg/m³. Inputs are outer diameter and wall thickness in mm,
// never nominal bore (Ду). This is a theoretical value, not the mass of a supplied batch.
export function roundSteelPipeMass(diameterMm: number, wallThicknessMm: number): number | undefined {
  if (!Number.isFinite(diameterMm) || !Number.isFinite(wallThicknessMm)
    || diameterMm <= 0 || wallThicknessMm <= 0 || 2 * wallThicknessMm >= diameterMm) return undefined;
  const mass = Math.PI * 7850 / 1_000_000 * wallThicknessMm * (diameterMm - wallThicknessMm);
  const rounded = Math.round(mass * 1000) / 1000;
  return Number.isFinite(rounded) && rounded > 0 ? rounded : undefined;
}

export function normalizePipeWeight(product: ProductVariant): ProductVariant {
  if (!isPipeProduct(product)) return product;
  if (product.categoryId === "cat-trp") {
    const mass = product.weightConfirmed && product.weightPerMeterKg !== undefined
      && Number.isFinite(product.weightPerMeterKg) && product.weightPerMeterKg > 0 ? product.weightPerMeterKg : undefined;
    return {...product, weightPerMeterKg: mass, weight: mass === undefined ? undefined : {value: mass, unit: "кг/м"}};
  }
  const geometricMass = product.diameterMm !== undefined && product.wallThicknessMm !== undefined
    ? roundSteelPipeMass(product.diameterMm, product.wallThicknessMm) : undefined;
  // An explicit mass has priority: the audited VGP records store table 1 of GOST 3262-75.
  const explicitMass = product.weightPerMeterKg;
  let mass: number | undefined;
  if (geometricMass !== undefined) {
    if (explicitMass !== undefined && Number.isFinite(explicitMass) && explicitMass > 0) mass = explicitMass;
    else if (["cat-trk", "cat-trs"].includes(product.categoryId)) mass = geometricMass;
  }
  const weight: ProductWeight | undefined = mass === undefined ? undefined : {value: mass, unit: "кг/м"};
  return {...product, weightPerMeterKg: mass, weight};
}
