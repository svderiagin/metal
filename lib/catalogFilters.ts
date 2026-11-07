import {parseCatalogNumber} from "./catalogNumberInput";

export function parseCatalogPrice(value: string) {
  const price = parseCatalogNumber(value);
  return price !== null && price >= 0 && !Object.is(price, -0) ? price : null;
}

// Unknown prices always follow known prices, in either sort direction.
export function comparePrices(left: number | null | undefined, right: number | null | undefined, descending = false) {
  if (left == null) return right == null ? 0 : 1;
  if (right == null) return -1;
  return descending ? right - left : left - right;
}
