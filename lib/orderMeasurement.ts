import type {ProductVariant} from "@/types/product";
import type {OrderInputMode} from "@/types/cart";

// Input limits are shared by the catalog, cart editor and authoritative repricing.
export function getMeasurementQuantityOptions(product: ProductVariant, mode: OrderInputMode) {
  const isVgp = product.categoryId === "cat-trk" && product.subcategoryId === "cat-trk-sub-1";
  const length = product.lengthMeters;
  const mass = product.weightPerMeterKg;
  const wholePipes = isVgp && length !== undefined && isPositiveFinite(length);
  const minimumMeters = wholePipes ? length : 0.01;
  const maximumTons = 999;
  const convertedMaximum = mass !== undefined && isPositiveFinite(mass) ? tonsToMeters(maximumTons, mass) : null;
  const maximumMeters = convertedMaximum !== null
    ? wholePipes ? Math.floor(convertedMaximum / length + 1e-9) * length : convertedMaximum
    : 9999;
  if (mode === "meter") {
    return {minimum: minimumMeters, maximum: maximumMeters, decimalPlaces: wholePipes ? undefined : 2};
  }
  if (mass !== undefined && isPositiveFinite(mass)) {
    const minimumTons = metersToTons(minimumMeters, mass);
    const wholeMaximumTons = wholePipes ? metersToTons(maximumMeters, mass) : maximumTons;
    // Keep one physical range; remove binary noise without a three-decimal tonne step.
    if (minimumTons !== null && wholeMaximumTons !== null) {
      return {minimum: Number(minimumTons.toPrecision(15)), maximum: Number(wholeMaximumTons.toPrecision(15)), decimalPlaces: undefined};
    }
  }
  return {minimum: 0.001, maximum: 999, decimalPlaces: 3};
}

export function getCartMeasurementQuantityOptions(product: ProductVariant, mode: OrderInputMode) {
  return getMeasurementQuantityOptions(product, mode);
}

export function metersToTons(meters: number, weightPerMeterKg: number) {
  if (!isNonNegativeFinite(meters) || !isPositiveFinite(weightPerMeterKg)) return null;
  // Length (m) × nominal linear mass (kg/m) / 1000 kg per tonne.
  const result = meters * weightPerMeterKg / 1000;
  return Number.isFinite(result) ? result : null;
}

export function tonsToMeters(tons: number, weightPerMeterKg: number) {
  if (!isNonNegativeFinite(tons) || !isPositiveFinite(weightPerMeterKg)) return null;
  // Mass (t) × 1000 kg per tonne / nominal linear mass (kg/m).
  const result = tons * 1000 / weightPerMeterKg;
  return Number.isFinite(result) ? result : null;
}

export function calculateLineTotal(weightTons: number, pricePerTon: number) {
  if (!isNonNegativeFinite(weightTons) || !isNonNegativeFinite(pricePerTon)) return null;
  const total = round(weightTons * pricePerTon, 2);
  return Number.isFinite(total) ? total : null;
}

export function parseNonNegativeDecimal(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value.replace(",", "."));
  return isNonNegativeFinite(parsed) ? parsed : null;
}

export function formatDecimal(value: number, maximumFractionDigits: number) {
  return value.toFixed(maximumFractionDigits).replace(/\.?0+$/, "");
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function isNonNegativeFinite(value: number) {
  return Number.isFinite(value) && value >= 0;
}

function isPositiveFinite(value: number) {
  return Number.isFinite(value) && value > 0;
}
