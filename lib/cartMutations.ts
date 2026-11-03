import type {CartItem, CartMeasurement, CartPieceOrder} from "@/types/cart";
import type {ProductVariant} from "@/types/product";
import {normalizeMeasurement} from "./cart";
import {revalidateCartPrice} from "./cartPricing";
import {isProfilePipeVariant, normalizePieceOrder} from "./profilePipe";

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

export function updateCartItem(items: CartItem[], product: ProductVariant | undefined, quantity: number): CartItem[] {
  if (!product || !Number.isFinite(quantity) || quantity <= 0) return items;
  const previous = items.find(item => item.productId === product.id);
  if (!previous) return items;
  let pieceOrder: CartPieceOrder | undefined;
  if (isProfilePipeVariant(product)) {
    const length = previous.pieceOrder?.lengthMeters ?? product.lengthMeters;
    pieceOrder = length ? normalizePieceOrder({pieces: quantity / length, lengthMeters: length}) : undefined;
    if (!pieceOrder) return items;
  }
  const measurement = previous.measurement ? {...previous.measurement,
    ...(previous.measurement.inputMode === "meter" ? {meters: quantity} : {weightTons: quantity})} : undefined;
  const next = priceItem(product, {productId: product.id, quantity, measurement, pieceOrder});
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
