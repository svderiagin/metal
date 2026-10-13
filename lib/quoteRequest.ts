import type {ProductVariant} from "@/types/product";

export function formatQuoteProductName(variant: Pick<ProductVariant, "name" | "diameterMm" | "lengthMeters">) {
  const {name, diameterMm, lengthMeters} = variant;
  if (!lengthMeters || !Number.isFinite(lengthMeters)) return name;
  const formatLength = () => new Intl.NumberFormat("ru-RU", {maximumFractionDigits: 3}).format(lengthMeters);
  const beam = name.match(/(\d+(?:[.,]\d+)?[БШКМ]\d*)[хx×](\d+)(?=\s|$)/iu);
  if (beam && Math.abs(Number(beam[2]) - lengthMeters * 1000) < 0.001) {
    return name.replace(beam[0], `${beam[1]}, длина ${formatLength()} м`);
  }
  if (!diameterMm) return name;
  return name.replace(/(\d+(?:[.,]\d+)?)\s*[хx×]\s*(\d+(?:[.,]\d+)?)(?=\s|$)/giu, (match, diameter: string, length: string) => {
    if (Number(diameter.replace(",", ".")) !== diameterMm || Math.abs(Number(length.replace(",", ".")) - lengthMeters * 1000) > 0.001) return match;
    const format = (value: number) => new Intl.NumberFormat("ru-RU", {maximumFractionDigits: 3}).format(value);
    return `${format(diameterMm)} мм, длина ${format(lengthMeters)} м`;
  });
}

export type QuoteOrder = {
  product: string;
  meters?: number | null;
  tons?: number | null;
  quantity?: number | null;
  unit?: string;
};

export function buildQuoteMessage(order: QuoteOrder) {
  const lines = ["Прошу рассчитать поставку:", `Наименование: ${order.product}`];
  const positive = (value: number | null | undefined): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
  const format = (value: number, digits: number) => new Intl.NumberFormat("ru-RU", {maximumFractionDigits: digits}).format(value);
  if (positive(order.meters)) lines.push(`Общая длина: ${format(order.meters, 2)} м`);
  if (positive(order.tons)) lines.push(`Вес: ${format(order.tons, order.tons < 0.001 ? 9 : 3)} т`);
  if (positive(order.quantity) && order.unit) lines.push(`Количество: ${format(order.quantity, 3)} ${order.unit}`);
  return lines.join("\n");
}
