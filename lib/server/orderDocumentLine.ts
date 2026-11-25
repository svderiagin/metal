import {getProductVariantById} from "@/lib/cartCatalog";
import type {OrderItem} from "@/types/order";

const units: Record<string, string> = {"за тонну": "т", "за штуку": "шт.", "за рулон": "рул.",
  "за погонный метр": "м", "за метр": "м", "за квадратный метр": "м²"};
const quantityFormat = new Intl.NumberFormat("ru-RU", {maximumSignificantDigits: 15});
const lengthFormat = new Intl.NumberFormat("ru-RU", {maximumFractionDigits: 2});

export function orderDocumentLine(item: OrderItem) {
  const unit = item.measurement ? "т" : units[item.priceUnit];
  if (!unit) throw new Error("UNKNOWN_INVOICE_UNIT");

  const product = getProductVariantById(item.productId);
  const label = product?.name === item.name ? product.checkoutLabel : undefined;
  const name = label ? [label.title, label.titleDetails].filter(Boolean).join(", ") : item.name;
  const sheets = label && product?.sheetOrder && unit === "м²" ? item.quantity / product.sheetOrder.quantityPerSheet : 0;
  const details = [
    item.pieceOrder && label ? product?.steelGrade : label?.details,
    item.measurement ? `Длина заказа ${lengthFormat.format(item.measurement.meters)} м` : undefined,
    item.pieceOrder ? `${quantityFormat.format(item.pieceOrder.pieces)} шт. по ${lengthFormat.format(item.pieceOrder.lengthMeters)} м` : undefined,
    sheets > 0 && Number.isInteger(sheets) ? `${quantityFormat.format(sheets)} шт.` : undefined,
  ].filter(Boolean).join(" · ");

  return {name, details, quantity: quantityFormat.format(item.measurement?.weightTons ?? item.quantity), unit,
    delivery: item.deliveryEstimate ? `Под заказ · ориентировочно ${item.deliveryEstimate}` : undefined};
}
