export const formatCurrency = (value: number) => new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0
}).format(value);

export function formatUnitPrice(value: number, priceUnit: string): string {
  const unit = getShortPriceUnit(priceUnit);
  return unit ? `${formatCurrency(value)}/${unit}` : formatCurrency(value);
}

function getShortPriceUnit(priceUnit: string): string {
  const normalizedUnit = priceUnit.toLocaleLowerCase("ru");
  if (normalizedUnit.includes("тонн")) return "т";
  if (normalizedUnit.includes("метр")) return "м";
  if (normalizedUnit.includes("лист")) return "лист";
  if (normalizedUnit.includes("штук")) return "шт.";
  return "";
}
