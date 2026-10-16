import type {ProductVariant} from "@/types/product";
import type {CartPieceOrder} from "@/types/cart";
import {calculateLineTotal} from "./orderMeasurement";

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

export function normalizePieceOrder(value: unknown): CartPieceOrder | undefined {
  if (!value || typeof value !== "object") return undefined;
  const order = value as Partial<CartPieceOrder>;
  if (typeof order.pieces !== "number" || !Number.isSafeInteger(order.pieces) || order.pieces <= 0 || order.pieces > 999
    || typeof order.lengthMeters !== "number" || !Number.isFinite(order.lengthMeters) || order.lengthMeters <= 0
    || !Number.isFinite(order.pieces * order.lengthMeters)) return undefined;
  return {pieces: order.pieces, lengthMeters: order.lengthMeters};
}

export function profilePipeOrder(product: ProductVariant, pieces: number, selectedLength?: number) {
  if (!isProfilePipeVariant(product) || !Number.isSafeInteger(pieces) || pieces < 0 || pieces > 999) return null;
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
    ? calculateLineTotal(meters, product.price!) : null;
  return {pieces, lengthMeters: length, meters, estimatedTotal};
}
