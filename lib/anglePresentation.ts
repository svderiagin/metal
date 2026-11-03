export function formatAngleSpecificationValue(value: string): string {
  return value
    .replace(/(\d)\.(?=\d)/g, "$1,")
    .replaceAll("кг/м.п.", "кг/м")
    .replace(/\s+(мм|м|кг\/м)$/u, "\u00a0$1");
}
