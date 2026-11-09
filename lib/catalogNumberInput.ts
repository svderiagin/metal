const decimalPattern = /^-?(?:(?:\d+|\d{1,3}(?:[ \u00a0\u202f]\d{3})+)(?:[.,]\d*)?|[.,]\d+)$/u;
const plainNumber = new Intl.NumberFormat("en-US", {useGrouping: false, maximumSignificantDigits: 21});

function normalizeDecimal(value: string) {
  return value.trim().replace(/[ \u00a0\u202f]/gu, "").replace(",", ".");
}

export function parseCatalogNumber(value: string): number | null {
  if (!decimalPattern.test(value.trim())) return null;
  const amount = Number(normalizeDecimal(value));
  // An underflowed positive value must never be treated as an explicit zero.
  return Number.isFinite(amount) && (amount !== 0 || !/[1-9]/u.test(value)) ? amount : null;
}

export function formatCatalogNumber(value: number) {
  return plainNumber.format(value);
}

export function parseOrderQuantity(value: string) {
  const quantity = parseCatalogNumber(value);
  return quantity !== null && quantity >= 0 && !Object.is(quantity, -0) ? quantity : null;
}

export function constrainOrderQuantityInput(value: string, maximum: number): {value: string; message?: string} {
  if (!decimalPattern.test(value.trim()) || value.trim().startsWith("-")) return {value};
  if (Number(normalizeDecimal(value)) > maximum) {
    return {value: String(maximum), message: `Значение ограничено максимумом ${formatCatalogNumber(maximum)}.`};
  }
  // Preserve the decimal separator and trailing fractional zeros while the user is typing.
  return {value: value.replace(/^(\s*)0+(?=\d)/u, "$1")};
}

export function correctOrderQuantity(value: string, {whole = false, minimum, maximum, decimalPlaces, fallback}: {
  whole?: boolean;
  minimum?: number;
  maximum?: number;
  decimalPlaces?: number;
  fallback?: number;
} = {}): {value: string; message?: string} {
  const parsed = parseCatalogNumber(value);
  if (!value.trim() || parsed === null || ((parsed < 0 || Object.is(parsed, -0)) && minimum === undefined)) {
    if (fallback !== undefined && Number.isFinite(fallback) && fallback >= 0) {
      // A saved quantity may carry exact converted precision beyond the input display.
      const restored = correctOrderQuantity(formatCatalogNumber(fallback), {whole, minimum, maximum});
      return {...restored, message: `Восстановлено количество ${restored.value.replace(".", ",")}.`};
    }
    return {value: "", ...(!value.trim() ? {} : {message: "Некорректное значение очищено."})};
  }
  const quantity = parsed;
  if (minimum !== undefined && quantity < minimum) {
    return {value: formatCatalogNumber(minimum), message: `Значение увеличено до минимума ${formatCatalogNumber(minimum).replace(".", ",")}.`};
  }
  if (maximum !== undefined && quantity > maximum) {
    return {value: String(maximum), message: `Значение ограничено максимумом ${formatCatalogNumber(maximum)}.`};
  }
  if (whole && !Number.isInteger(quantity)) {
    const rounded = Math.ceil(quantity);
    return {value: String(rounded), message: `Количество округлено вверх до ${rounded}.`};
  }
  const normalized = normalizeDecimal(value);
  if (decimalPlaces !== undefined && (normalized.split(".")[1]?.length ?? 0) > decimalPlaces) {
    const rounded = Number(new Intl.NumberFormat("en-US", {
      useGrouping: false, maximumFractionDigits: decimalPlaces,
    }).format(quantity));
    if (quantity > 0 && rounded === 0) {
      const minimum = formatCatalogNumber(10 ** -decimalPlaces).replace(".", ",");
      return {value: "", message: `Значение очищено. Минимум — ${minimum}.`};
    }
    if (rounded !== quantity) {
      return {value: formatCatalogNumber(rounded), message: `Значение округлено до ${formatCatalogNumber(rounded).replace(".", ",")}.`};
    }
  }
  return {value: formatCatalogNumber(quantity)};
}
