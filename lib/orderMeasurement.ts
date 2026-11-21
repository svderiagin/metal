import type {ProductVariant} from "@/types/product";
import type {OrderInputMode} from "@/types/cart";
import {isDemonstrationProduct} from "./catalogOffer";
import {MAX_ORDER_TONS} from "./constants";
import {isWholePipeVariant} from "./pipeFamily";

// Input limits are shared by the catalog, cart editor and authoritative repricing.
export function getMeasurementQuantityOptions(product: ProductVariant, mode: OrderInputMode) {
  const length = product.lengthMeters;
  const mass = isDemonstrationProduct(product) ? undefined : product.weightPerMeterKg;
  const wholePipes = isWholePipeVariant(product) && mass !== undefined && isPositiveFinite(mass) && length !== undefined && isPositiveFinite(length);
  const minimumMeters = wholePipes ? length : 0.01;
  const maximumTons = MAX_ORDER_TONS;
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
  return {minimum: 0.001, maximum: MAX_ORDER_TONS, decimalPlaces: 3};
}

export function getCartMeasurementQuantityOptions(product: ProductVariant, mode: OrderInputMode) {
  return getMeasurementQuantityOptions(product, mode);
}

export function metersToTons(meters: number, weightPerMeterKg: number) {
  if (!isNonNegativeFinite(meters) || !isPositiveFinite(weightPerMeterKg)) return null;
  // The exact metre limit converts back to 999 t even with a fractional linear weight.
  if (meters === tonsToMeters(MAX_ORDER_TONS, weightPerMeterKg)) return MAX_ORDER_TONS;
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

export function calculateLineTotal(quantity: number, unitPrice: number) {
  return roundPriceProduct([quantity, unitPrice]);
}

export function calculateMeasuredLineTotal(meters: number, weightPerMeterKg: number, pricePerTon: number) {
  if (!isPositiveFinite(weightPerMeterKg)) return null;
  return roundPriceProduct([meters, weightPerMeterKg, pricePerTon], 3);
}

export function calculatePieceLineTotal(pieces: number, lengthMeters: number, pricePerMeter: number) {
  if (!isPositiveFinite(lengthMeters)) return null;
  return roundPriceProduct([pieces, lengthMeters, pricePerMeter]);
}

export function parseNonNegativeDecimal(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value.replace(",", "."));
  return isNonNegativeFinite(parsed) ? parsed : null;
}

export function formatDecimal(value: number, maximumFractionDigits: number) {
  return value.toFixed(maximumFractionDigits).replace(/\.?0+$/, "");
}

function roundPriceProduct(factors: readonly number[], conversionScale = 0) {
  let coefficient = BigInt(1);
  let scale = conversionScale;
  // Keep decimal factors exact until the final half-up rounding to kopecks.
  for (const factor of factors) {
    if (!isNonNegativeFinite(factor)) return null;
    const [digits, exponent = "0"] = factor.toString().split("e");
    const [whole, fraction = ""] = digits.split(".");
    coefficient *= BigInt(whole + fraction);
    scale += fraction.length - Number(exponent);
  }
  const power = BigInt(10) ** BigInt(Math.abs(2 - scale));
  const kopecks = scale <= 2 ? coefficient * power : (coefficient + power / BigInt(2)) / power;
  const total = Number(kopecks) / 100;
  return Number.isFinite(total) && (factors[0] === 0 || total > 0) ? total : null;
}

function isNonNegativeFinite(value: number) {
  return Number.isFinite(value) && value >= 0;
}

function isPositiveFinite(value: number) {
  return Number.isFinite(value) && value > 0;
}
