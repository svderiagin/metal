import type {ProductVariant} from "@/types/product";
import type {CartPieceOrder} from "@/types/cart";
import {calculatePieceLineTotal, metersToTons, tonsToMeters, wholeLengthPieces} from "./orderMeasurement";

export type ProfilePipeOrderUnit = "piece" | "meter" | "ton";
export const MAX_PROFILE_PIPE_PIECES = 999;

export function isSquareProfilePipe(product: Pick<ProductVariant, "categoryId" | "subcategoryId">) {
  return product.categoryId === "cat-trp" && product.subcategoryId === "cat-trp-sub-1";
}

export function profilePipeMassPerMeter(product: ProductVariant) {
  const mass = product.weightPerMeterKg;
  return product.weightConfirmed && mass !== undefined && Number.isFinite(mass) && mass > 0 ? mass : null;
}

export function isProfilePipeVariant(product: ProductVariant): boolean {
  return product.categoryId === "cat-trp"
    && ["cat-trp-sub-1", "cat-trp-sub-2"].includes(product.subcategoryId)
    && product.profileWidthMm !== undefined && product.profileHeightMm !== undefined
    && product.wallThicknessMm !== undefined;
}

export function profilePipeSize(product: ProductVariant): string {
  return `${product.profileWidthMm}×${product.profileHeightMm}`;
}

export function hasConfirmedProfilePipePrice(product: ProductVariant): boolean {
  return product.priceConfirmed === true && product.unit === "meter" && product.priceUnit.toLocaleLowerCase("ru").includes("метр") && !product.quoteOnly
    && product.priceQualifier !== "from" && product.price !== null
    && Number.isFinite(product.price) && product.price > 0;
}

export function profilePipePricePerTon(product: ProductVariant) {
  const mass = profilePipeMassPerMeter(product);
  if (mass === null || product.price === null || !hasConfirmedProfilePipePrice(product)) return undefined;
  const price = product.price * (1000 / mass);
  return Number.isFinite(price) ? price : undefined;
}

export function normalizePieceOrder(value: unknown): CartPieceOrder | undefined {
  if (!value || typeof value !== "object") return undefined;
  const order = value as Partial<CartPieceOrder>;
  if (typeof order.pieces !== "number" || !Number.isSafeInteger(order.pieces) || order.pieces <= 0 || order.pieces > MAX_PROFILE_PIPE_PIECES
    || typeof order.lengthMeters !== "number" || !Number.isFinite(order.lengthMeters) || order.lengthMeters <= 0
    || !Number.isFinite(order.pieces * order.lengthMeters)) return undefined;
  return {pieces: order.pieces, lengthMeters: order.lengthMeters};
}

export function profilePipeOrder(product: ProductVariant, pieces: number, selectedLength?: number) {
  if (!isProfilePipeVariant(product) || !Number.isSafeInteger(pieces) || pieces < 0 || pieces > MAX_PROFILE_PIPE_PIECES) return null;
  const length = selectedLength ?? product.lengthMeters;
  if (length === undefined || !Number.isFinite(length) || length <= 0) return null;
  if (product.lengthMeters !== undefined) {
    if (length !== product.lengthMeters) return null;
  } else {
    const range = product.lengthRangeMeters;
    if (!range || length < range[0] || length > range[1]) return null;
  }
  const meters = pieces * length;
  if (!Number.isFinite(meters)) return null;
  const estimatedTotal = hasConfirmedProfilePipePrice(product)
    ? calculatePieceLineTotal(pieces, length, product.price!) : null;
  const mass = profilePipeMassPerMeter(product);
  return {pieces, lengthMeters: length, meters, weightTons: mass === null ? null : metersToTons(meters, mass), estimatedTotal};
}

export function profilePipeOrderByQuantity(
  product: ProductVariant, quantity: number, unit: ProfilePipeOrderUnit, length = product.lengthMeters,
) {
  if (unit === "piece") return profilePipeOrder(product, quantity, length);
  if (!Number.isFinite(quantity) || quantity < 0 || length === undefined || !Number.isFinite(length) || length <= 0) return null;
  const mass = profilePipeMassPerMeter(product);
  const meters = unit === "meter" ? quantity : mass === null ? null : tonsToMeters(quantity, mass);
  return meters === null ? null : profilePipeOrder(product, wholeLengthPieces(meters, length), length);
}
