import {formatCatalogNumber} from "./catalogNumberInput";
import {MAX_ORDER_TONS} from "./constants";
import {sameMeasuredQuantity, wholeLengthMeters, wholeLengthPiecesAtMost} from "./orderMeasurement";
import type {OrderInputMode} from "@/types/cart";

const quantityFormatter = new Intl.NumberFormat("ru-RU", {
  useGrouping: true,
  maximumSignificantDigits: 21,
});

export function formatCartQuantity(value: number) {
  return quantityFormatter.format(value).replace(/\u00a0/gu, "\u202f");
}

export function formatEditableCartQuantity(value: number) {
  return formatCatalogNumber(value).replace(".", ",");
}

const compactQuantityFormatters = new Map<string, Intl.NumberFormat>();

export function formatQuantityForInput(value: number, grouped = false, fractionDigits = 6) {
  const key = `${grouped}-${fractionDigits}`;
  let formatter = compactQuantityFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("ru-RU", {useGrouping: grouped, maximumFractionDigits: fractionDigits});
    compactQuantityFormatters.set(key, formatter);
  }
  const formatted = formatter.format(value).replace(/\u00a0/gu, "\u202f");
  // Keep tiny positive conversions and legacy quantities distinguishable from zero.
  return value > 0 && formatted === "0" ? formatEditableCartQuantity(Number(value.toPrecision(3))) : formatted;
}

export function measuredTonFractionDigits(value: number) {
  return value < 0.001 ? 8 : 6;
}

export function formatMeasuredQuantity(value: number, mode: OrderInputMode, grouped = false) {
  if (mode === "meter") return formatQuantityForInput(value, grouped, 2);
  // A rounded display of 999 would make it impossible to explicitly enter the limit.
  const display = value < MAX_ORDER_TONS ? Math.min(value, MAX_ORDER_TONS - 0.000001) : value;
  return formatQuantityForInput(display, grouped, measuredTonFractionDigits(value));
}

export function formatStockLengthBreakdown(meters: number | undefined, stockLength: number | undefined) {
  if (!meters || !stockLength || !Number.isFinite(meters) || !Number.isFinite(stockLength) || meters < 0 || stockLength < 0) return;
  const pieces = wholeLengthPiecesAtMost(meters, stockLength);
  if (!Number.isSafeInteger(pieces)) return;
  const length = `${formatCartQuantity(stockLength)}\u00a0м`;
  if (pieces === 0) return `< 1\u00a0шт. по ${length}`;
  const fullMeters = wholeLengthMeters(pieces, stockLength);
  const fullLengths = `${formatCartQuantity(pieces)}\u00a0шт. по ${length}`;
  if (sameMeasuredQuantity(meters, fullMeters)) return fullLengths;
  return `${fullLengths} + ${formatMeasuredQuantity(meters - fullMeters, "meter", true)}\u00a0м`;
}

export const rebarMinimumMeterEntry = 0.01;
export const rebarMinimumTonEntry = 0.00001;
export type DraftPrecision = number | ((amount: number) => number | undefined);

export function productOrderFractionDigits(amount: number) {
  return amount > 0 && amount < 0.000001 ? undefined : 6;
}

export function rebarTonFractionDigits(amount: number) {
  return Math.max(0, 6 - String(Math.trunc(amount)).length);
}

export function formatRebarOrderTons(tons: number, preserveBelowMaximum = false, grouped = false) {
  const digits = rebarTonFractionDigits(tons);
  const formatted = formatQuantityForInput(tons, grouped, digits);
  if (preserveBelowMaximum && tons < MAX_ORDER_TONS && formatted === String(MAX_ORDER_TONS)) {
    return formatQuantityForInput(MAX_ORDER_TONS - 10 ** -digits, grouped, digits);
  }
  return formatted;
}

// The caller has already validated the syntax. Keep the exact request when rounding
// the displayed digits could change the number of stock lengths on the order.
export function correctDraftPrecision(text: string, precision: DraftPrecision,
  {minimum = 0, maximum}: {minimum?: number; maximum: number},
  stockQuantity?: (amount: number) => number | undefined) {
  const fraction = text.split(",")[1];
  if (!fraction?.length) return;
  const amount = Number(text.replace(",", "."));
  const digitsFor = (quantity: number) => typeof precision === "number" ? precision : precision(quantity);
  const digits = digitsFor(amount);
  if (digits === undefined || fraction.length <= digits || amount > maximum) return;
  const smallestEntry = Number(`1e-${digitsFor(0) ?? digits}`);
  const substitutedMinimum = amount < smallestEntry ? Math.max(minimum, smallestEntry) : undefined;
  const adjusted = substitutedMinimum ?? amount;
  let result = formatQuantityForInput(adjusted, false, digitsFor(adjusted));
  const shipped = stockQuantity?.(adjusted);
  if (shipped !== undefined && shipped !== stockQuantity?.(Number(result.replace(",", ".")))) {
    result = formatQuantityForInput(shipped, false, digitsFor(shipped));
  }
  // A subsequent zero must continue the fraction instead of multiplying the replacement by ten.
  if (digits > 0 && !result.includes(",")) result += "," + "0".repeat(Math.min(2, digits));
  return {text: result, substitutedMinimum, exactQuantity: shipped !== undefined ? adjusted : substitutedMinimum};
}

export function normalizeCartQuantityText(value: string) {
  // Keep grouping boundaries for validation; never join unrelated numbers or spreadsheet cells.
  return value.trim().replace(/[ \u00a0\u202f\u2009]+/gu, " ");
}

export function normalizeCartQuantityDraft(value: string, selectionStart: number | null, selectionEnd: number | null,
  {maximum = Infinity, formatMaximum = formatEditableCartQuantity}: {maximum?: number; formatMaximum?: (value: number) => string} = {}): {
    accepted: boolean; value: string; selectionStart: number | null; selectionEnd: number | null; message?: string; capped?: boolean;
  } {
  const normalized = normalizeCartQuantityText(value);
  const reject = (message: string) => ({accepted: false, value, selectionStart, selectionEnd, message});
  if (/[\r\n\t]/u.test(value)) return reject("Вставьте одно число без переносов строк и табуляции.");
  if (normalized.includes(" ") && !/^\d{1,3}(?: \d{3})+(?:[.,]\d*)?$/u.test(normalized)) {
    return reject("Проверьте число: пробелы допускаются только между группами из трёх цифр.");
  }
  if (!/^\d*(?:[.,]\d*)?$/u.test(normalized.replace(/ /gu, ""))) {
    return reject("Допустимы только цифры и один десятичный разделитель.");
  }

  let next = value.replace(/\s/gu, "").replace(".", ",");
  let start = selectionStart === null ? null : value.slice(0, selectionStart).replace(/\s/gu, "").length;
  let end = selectionEnd === null ? null : value.slice(0, selectionEnd).replace(/\s/gu, "").length;
  if (next.startsWith(",")) {
    next = `0${next}`;
    if (start !== null) start++;
    if (end !== null) end++;
  }
  const zeros = /^0+(?=\d)/u.exec(next)?.[0].length ?? 0;
  if (zeros) {
    next = next.slice(zeros);
    if (start !== null) start = Math.max(0, start - zeros);
    if (end !== null) end = Math.max(0, end - zeros);
  }
  // Check overflow as well: a long positive digit sequence can become Infinity.
  if (Number(next.replace(",", ".")) > maximum) {
    const limited = formatMaximum(maximum);
    return {accepted: true, value: limited, selectionStart: limited.length, selectionEnd: limited.length, capped: true};
  }
  return {accepted: true, value: next, selectionStart: start, selectionEnd: end};
}

type QuantityTransfer = {preventDefault(): void} & ({clipboardData: DataTransfer} | {dataTransfer: DataTransfer});

export function quantityTransferHandlers(onReject?: (message: string) => void) {
  function check(event: QuantityTransfer) {
    const data = "clipboardData" in event ? event.clipboardData : event.dataTransfer;
    const text = data.getData("text/plain");
    const result = normalizeCartQuantityDraft(text, null, null);
    if (result.accepted && /\d/u.test(text)) return;
    event.preventDefault();
    onReject?.(result.message ?? "Вставьте одно число.");
  }
  return {onPaste: check, onDrop: check};
}

export function stepCartQuantity(value: number, step: number, direction: number) {
  // Add the decimal representations exactly so 0.1 + 0.001 does not expose binary noise.
  const parts = [value, step].map(number => formatCatalogNumber(number).split("."));
  const scale = Math.max(...parts.map(([, fraction = ""]) => fraction.length));
  const integers = parts.map(([integer, fraction = ""]) => BigInt(integer + fraction.padEnd(scale, "0")));
  const result = integers[0] + BigInt(direction) * integers[1];
  const sign = result < BigInt(0) ? "-" : "";
  const digits = (result < BigInt(0) ? -result : result).toString().padStart(scale + 1, "0");
  return Number(scale ? `${sign}${digits.slice(0, -scale)}.${digits.slice(-scale)}` : `${sign}${digits}`);
}
