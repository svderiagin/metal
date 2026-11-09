import type {OrderConfirmation} from "@/types/order";
import {ORDER_STORAGE_KEY} from "./constants";
import {isValidEmail} from "./validation";
import {parseInvoiceReceipt} from "./invoiceReceipt";

let memory: OrderConfirmation | null = null;

export function parseOrderConfirmation(value: unknown): OrderConfirmation | null {
  if (!value || typeof value !== "object") return null;
  const order = value as Partial<OrderConfirmation>;
  if (typeof order.orderNumber !== "string" || !/^MS-[A-F0-9]{12}$/.test(order.orderNumber)
    || (order.paymentMethod !== "CARD" && order.paymentMethod !== "INVOICE")
    || typeof order.email !== "string" || !isValidEmail(order.email)) return null;
  const invoice = order.invoice === undefined ? undefined : parseInvoiceReceipt(order.invoice, order.orderNumber);
  if (invoice === null) return null;
  return {orderNumber: order.orderNumber, paymentMethod: order.paymentMethod, email: order.email,
    paymentPending: order.paymentMethod === "CARD", ...(invoice ? {invoice} : {})};
}

export function rememberOrderConfirmation(order: OrderConfirmation, storage: () => Pick<Storage, "setItem"> = () => window.sessionStorage) {
  memory = parseOrderConfirmation(order);
  try {storage().setItem(ORDER_STORAGE_KEY, JSON.stringify(memory));} catch { /* Client navigation retains the confirmed order in memory. */ }
}

export function readOrderConfirmation(storage: () => Pick<Storage, "getItem"> = () => window.sessionStorage): OrderConfirmation | null {
  try {
    const raw = storage().getItem(ORDER_STORAGE_KEY);
    return raw ? parseOrderConfirmation(JSON.parse(raw)) : memory;
  } catch {return memory;}
}
