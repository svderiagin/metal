import {formatCatalogNumber} from "./catalogNumberInput";

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

export function normalizeCartQuantityText(value: string) {
  // Keep grouping boundaries for validation; never join unrelated numbers or spreadsheet cells.
  return value.trim().replace(/[ \u00a0\u202f\u2009]+/gu, " ");
}

export function normalizeCartQuantityDraft(value: string, selectionStart: number | null, selectionEnd: number | null,
  {maximum = Infinity}: {maximum?: number} = {}): {
    accepted: boolean; value: string; selectionStart: number | null; selectionEnd: number | null; message?: string;
  } {
  const normalized = normalizeCartQuantityText(value);
  const reject = (message: string) => ({accepted: false, value, selectionStart, selectionEnd, message});
  if (/[\r\n\t]/u.test(normalized)) return reject("Вставьте одно число без переносов строк и табуляции.");
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
    const limited = formatEditableCartQuantity(maximum);
    return {accepted: true, value: limited, selectionStart: limited.length, selectionEnd: limited.length,
      message: `Значение ограничено максимумом ${formatCartQuantity(maximum)}.`};
  }
  return {accepted: true, value: next, selectionStart: start, selectionEnd: end};
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
