import {metersToTons, tonsToMeters} from "./orderMeasurement";
import type {ProductVariant} from "@/types/product";
import type {OrderInputMode} from "@/types/cart";

export function isVgpVariant(product: ProductVariant): boolean {
  return product.categoryId === "cat-trk" && product.subcategoryId === "cat-trk-sub-1";
}

export function vgpSize(product: ProductVariant): string {
  return `${product.nominalBoreMm}×${String(product.wallThicknessMm).replace(".", ",")}`;
}

export function vgpSeries(product: ProductVariant): string {
  return product.specifications.find(spec => spec.name === "Серия по толщине стенки")?.value ?? "—";
}

// Cutting is not offered in the catalog. Round the requested volume up to whole pipes.
// Keep the unrounded mass for pricing; rounding is only for the input display.
export function wholeVgpOrder(product: ProductVariant, quantity: number, mode: OrderInputMode) {
  const length = product.lengthMeters;
  const mass = product.weightPerMeterKg;
  if (!Number.isFinite(quantity) || quantity < 0 || !length || !Number.isFinite(length) || length <= 0
    || !mass || !Number.isFinite(mass) || mass <= 0) return null;
  const requestedMeters = mode === "meter" ? quantity : tonsToMeters(quantity, mass);
  if (requestedMeters === null) return null;
  const requestedPieces = requestedMeters / length;
  // Tolerate floating point noise at an exact whole-pipe boundary, never a real fraction.
  const nearest = Math.round(requestedPieces);
  const pieces = Math.abs(requestedPieces - nearest) <= 1e-9 ? nearest : Math.ceil(requestedPieces);
  if (!Number.isSafeInteger(pieces) || (quantity > 0 && pieces === 0)) return null;
  const meters = pieces * length;
  const weightTons = metersToTons(meters, mass);
  return weightTons === null ? null : {pieces, meters, weightTons};
}
