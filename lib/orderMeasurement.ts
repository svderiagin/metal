import type {ProductVariant} from "@/types/product";
import type {OrderInputMode} from "@/types/cart";
import {isDemonstrationProduct} from "./catalogOffer";
import {MAX_ORDER_TONS} from "./constants";
import {isWholePipeVariant} from "./pipeFamily";

export function requiresWholeLengthOrder(product: ProductVariant): boolean {
  return isWholePipeVariant(product) || (product.categoryId === "cat-arm" && product.form === "bar"
    && !isDemonstrationProduct(product) && product.lengthRangeMeters === undefined
    && product.lengthMeters !== undefined && isPositiveFinite(product.lengthMeters));
}

export function wholeLengthMeters(pieces: number, lengthMeters: number) {
  // Whole-millimetre catalog lengths can be multiplied exactly before converting
  // back to metres. This matters when a whole order costs exactly half a kopeck.
  const millimeters = Math.round(lengthMeters * 1000);
  const totalMillimeters = millimeters * pieces;
  return lengthMeters === millimeters / 1000 && Number.isSafeInteger(totalMillimeters)
    ? totalMillimeters / 1000 : lengthMeters * pieces;
}

export function sameMeasuredQuantity(value: number, reference: number) {
  return Math.abs(value - reference) <= Math.abs(reference) * Number.EPSILON * 4;
}

function stockPieceRatio(meters: number, length: number) {
  const ratio = meters / length;
  const nearest = Math.round(ratio);
  return sameMeasuredQuantity(ratio, nearest) ? nearest : ratio;
}

export function wholeLengthPieces(meters: number, length: number) {
  return meters > 0 ? Math.max(1, Math.ceil(stockPieceRatio(meters, length))) : 0;
}

export function wholeLengthPiecesAtMost(meters: number, length: number) {
  return Math.floor(stockPieceRatio(meters, length));
}

// Input limits are shared by the catalog, cart editor and authoritative repricing.
export function getMeasurementQuantityOptions(product: ProductVariant, mode: OrderInputMode) {
  const length = product.lengthMeters;
  const mass = isDemonstrationProduct(product) ? undefined : product.weightPerMeterKg;
  const wholeLengths = requiresWholeLengthOrder(product) && mass !== undefined && isPositiveFinite(mass) && length !== undefined && isPositiveFinite(length);
  const minimumMeters = wholeLengths ? length : 0.01;
  const maximumTons = MAX_ORDER_TONS;
  const convertedMaximum = mass !== undefined && isPositiveFinite(mass) ? tonsToMeters(maximumTons, mass) : null;
  const maximumMeters = convertedMaximum !== null
    ? wholeLengths ? wholeLengthMeters(wholeLengthPiecesAtMost(convertedMaximum, length), length) : convertedMaximum
    : 9999;
  if (mode === "meter") {
    return {minimum: minimumMeters, maximum: maximumMeters, decimalPlaces: wholeLengths ? undefined : 2};
  }
  if (mass !== undefined && isPositiveFinite(mass)) {
    const minimumTons = metersToTons(minimumMeters, mass);
    const wholeMaximumTons = wholeLengths ? metersToTons(maximumMeters, mass) : maximumTons;
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

export function getSimpleOrderQuantityOptions(product?: ProductVariant): {
  maximum: number;
  minimum?: number;
  decimalPlaces?: number;
} {
  return product?.categoryId === "catalog-cat-ugolok" && product.unit === "meter"
    ? getMeasurementQuantityOptions(product, "meter")
    : {maximum: 999};
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

// Round up to whole stock lengths, preserving the exact mass used for pricing.
export function wholeLengthOrder(product: ProductVariant, quantity: number, mode: OrderInputMode) {
  const length = product.lengthMeters;
  const mass = product.weightPerMeterKg;
  if (!Number.isFinite(quantity) || quantity < 0 || !length || !Number.isFinite(length) || length <= 0
    || !mass || !Number.isFinite(mass) || mass <= 0) return null;
  const requestedMeters = mode === "meter" ? quantity : tonsToMeters(quantity, mass);
  if (requestedMeters === null) return null;
  const pieces = quantity > 0 ? Math.max(1, wholeLengthPieces(requestedMeters, length)) : 0;
  if (!Number.isSafeInteger(pieces)) return null;
  const meters = wholeLengthMeters(pieces, length);
  const weightTons = metersToTons(meters, mass);
  return weightTons === null ? null : {pieces, meters, weightTons};
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
