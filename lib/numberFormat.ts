const russianNumberFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 3,
});

const massPerMeterFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatNumber(value: number): string {
  return russianNumberFormatter.format(value);
}

export function formatMassPerMeter(value: number): string {
  return massPerMeterFormatter.format(value);
}
