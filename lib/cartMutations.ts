import type {CartItem, CartMeasurement, CartPieceOrder, OrderInputMode} from "@/types/cart";
import type {ProductVariant} from "@/types/product";
import {normalizeMeasurement} from "./cart";
import {revalidateCartPrice} from "./cartPricing";
import {isProfilePipeVariant, profilePipeOrder} from "./profilePipe";
import {isVgpVariant, wholeVgpOrder} from "./vgp";
import {metersToTons, tonsToMeters} from "./orderMeasurement";
import {isDemonstrationProduct} from "./catalogOffer";

export function addCartItem(items: CartItem[], product: ProductVariant | undefined, quantity = 1,
  measurement?: CartMeasurement, pieceOrder?: CartPieceOrder): CartItem[] {
  if (!product) return items;
  const normalized = priceItem(product, {productId: product.id, quantity, measurement, pieceOrder});
  if (!normalized) return items;
  if (normalized.measurement || normalized.pieceOrder) return replace(items, normalized);
  const previous = items.find(item => item.productId === product.id);
  const previousQuantity = previous?.measurement && product.unit === "ton"
    ? previous.measurement.weightTons : previous?.quantity ?? 0;
  const next = priceItem(product, {productId: product.id, quantity: Math.min(999, previousQuantity + quantity)});
  return next ? replace(items, next) : items;
}

export function updateCartItem(items: CartItem[], product: ProductVariant | undefined, quantity: number,
  mode?: OrderInputMode): CartItem[] {
  if (!product || !Number.isFinite(quantity) || quantity <= 0) return items;
  if (mode !== undefined && mode !== "meter" && mode !== "ton") return items;
  const previous = items.find(item => item.productId === product.id);
  if (!previous) return items;
  if (isProfilePipeVariant(product)) {
    if (mode !== undefined) return items;
    const length = previous.pieceOrder?.lengthMeters ?? product.lengthMeters;
    const requestedPieces = length ? quantity / length : NaN;
    const nearest = Math.round(requestedPieces);
    const pieces = Math.abs(requestedPieces - nearest) <= 1e-9 ? nearest : requestedPieces;
    return length ? updateCartPieceOrder(items, product, pieces, length) : items;
  }
  const inputMode = mode ?? previous.measurement?.inputMode;
  let measurement: CartMeasurement | undefined;
  if (inputMode !== undefined) {
    // A legacy tonne line can adopt measured input only when catalog data supports conversion.
    if ((!previous.measurement && product.unit !== "ton") || isDemonstrationProduct(product)
      || !product.weightPerMeterKg || !Number.isFinite(product.weightPerMeterKg) || product.weightPerMeterKg <= 0
      || !product.pricePerTon || !Number.isFinite(product.pricePerTon) || product.pricePerTon <= 0) return items;
    const meters = inputMode === "meter" ? quantity : tonsToMeters(quantity, product.weightPerMeterKg);
    const weightTons = inputMode === "ton" ? quantity : metersToTons(quantity, product.weightPerMeterKg);
    if (meters === null || weightTons === null) return items;
    measurement = {inputMode, meters, weightTons, pricePerTon: 0, estimatedTotal: 0};
    if (isVgpVariant(product)) {
      const order = wholeVgpOrder(product, quantity, inputMode);
      if (!order) return items;
      measurement = {...measurement, meters: order.meters, weightTons: order.weightTons};
    }
    quantity = inputMode === "meter" ? measurement.meters : measurement.weightTons;
  }
  const next = priceItem(product, {productId: product.id, quantity, measurement});
  return next ? replace(items, next) : items;
}

export function updateCartPieceOrder(items: CartItem[], product: ProductVariant | undefined,
  pieces: number, lengthMeters: number): CartItem[] {
  if (!product || !items.some(item => item.productId === product.id)) return items;
  const order = profilePipeOrder(product, pieces, lengthMeters);
  if (!order || order.pieces <= 0 || order.estimatedTotal === null) return items;
  const next = priceItem(product, {productId: product.id, quantity: order.meters,
    pieceOrder: {pieces: order.pieces, lengthMeters: order.lengthMeters}});
  return next ? replace(items, next) : items;
}

function priceItem(product: ProductVariant, item: CartItem): CartItem | null {
  const measurement = item.measurement ? normalizeMeasurement(item.measurement) : undefined;
  if (item.measurement && !measurement) return null;
  const priced = revalidateCartPrice(product, {...item, measurement});
  if (priced.invalidReason) return null;
  return {productId: product.id,
    quantity: priced.measurement ? priced.measurement.inputMode === "meter" ? priced.measurement.meters : priced.measurement.weightTons : item.quantity,
    ...(priced.measurement ? {measurement: priced.measurement} : {}),
    ...(priced.pieceOrder ? {pieceOrder: priced.pieceOrder} : {})};
}

function replace(items: CartItem[], next: CartItem) {
  return items.some(item => item.productId === next.productId)
    ? items.map(item => item.productId === next.productId ? next : item) : [...items, next];
}
