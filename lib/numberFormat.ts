const russianNumberFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 3,
});

export function formatNumber(value: number): string {
  return russianNumberFormatter.format(value);
}
