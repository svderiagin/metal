export function metersToTons(meters: number, weightPerMeterKg: number) {
  if (!isNonNegativeFinite(meters) || !isPositiveFinite(weightPerMeterKg)) return null;
  // Length (m) × nominal linear mass (kg/m) / 1000 kg per tonne.
  const result = meters * weightPerMeterKg / 1000;
  return Number.isFinite(result) ? result : null;
}

export function tonsToMeters(tons: number, weightPerMeterKg: number) {
  if (!isNonNegativeFinite(tons) || !isPositiveFinite(weightPerMeterKg)) return null;
  // Mass (t) × 1000 kg per tonne / nominal linear mass (kg/m).
  const result = tons * 1000 / weightPerMeterKg;
  return Number.isFinite(result) ? result : null;
}

export function calculateLineTotal(weightTons: number, pricePerTon: number) {
  if (!isNonNegativeFinite(weightTons) || !isNonNegativeFinite(pricePerTon)) return null;
  const total = round(weightTons * pricePerTon, 2);
  return Number.isFinite(total) ? total : null;
}

export function parseNonNegativeDecimal(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value.replace(",", "."));
  return isNonNegativeFinite(parsed) ? parsed : null;
}

export function formatDecimal(value: number, maximumFractionDigits: number) {
  return value.toFixed(maximumFractionDigits).replace(/\.?0+$/, "");
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function isNonNegativeFinite(value: number) {
  return Number.isFinite(value) && value >= 0;
}

function isPositiveFinite(value: number) {
  return Number.isFinite(value) && value > 0;
}
