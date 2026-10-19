export const formatCurrency = (value: number) => new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 2
}).format(value);

export function formatUnitPrice(value: number | null, priceUnit: string): string {
  if (value === null) return "По запросу";
  const unit = getShortPriceUnit(priceUnit);
  return unit ? `${formatCurrency(value)}/${unit}` : formatCurrency(value);
}

function getShortPriceUnit(priceUnit: string): string {
  const normalizedUnit = priceUnit.toLocaleLowerCase("ru");
  if (normalizedUnit.includes("квадратн")) return "м²";
  if (normalizedUnit.includes("тонн")) return "т";
  if (normalizedUnit.includes("метр")) return "м";
  if (normalizedUnit.includes("лист")) return "лист";
  if (normalizedUnit.includes("штук")) return "шт.";
  if (normalizedUnit.includes("килограмм")) return "кг";
  return "";
}
