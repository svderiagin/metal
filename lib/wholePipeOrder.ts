import {metersToTons, tonsToMeters} from "./orderMeasurement";
import type {ProductVariant} from "@/types/product";
import type {OrderInputMode} from "@/types/cart";

// Cutting is not offered in the catalog. Round the requested volume up to whole pipes.
// Keep the unrounded mass for pricing; rounding is only for the input display.
export function wholePipeOrder(product: ProductVariant, quantity: number, mode: OrderInputMode) {
  const length = product.lengthMeters;
  const mass = product.weightPerMeterKg;
  if (!Number.isFinite(quantity) || quantity < 0 || !length || !Number.isFinite(length) || length <= 0
    || !mass || !Number.isFinite(mass) || mass <= 0) return null;
  const requestedMeters = mode === "meter" ? quantity : tonsToMeters(quantity, mass);
  if (requestedMeters === null) return null;
  const requestedPieces = requestedMeters / length;
  // Tolerate floating point noise at an exact whole-pipe boundary, never a real fraction.
  const nearest = Math.round(requestedPieces);
  const rounded = Math.abs(requestedPieces - nearest) <= 1e-9 ? nearest : Math.ceil(requestedPieces);
  const pieces = quantity > 0 ? Math.max(1, rounded) : 0;
  if (!Number.isSafeInteger(pieces)) return null;
  const meters = pieces * length;
  const weightTons = metersToTons(meters, mass);
  return weightTons === null ? null : {pieces, meters, weightTons};
}
