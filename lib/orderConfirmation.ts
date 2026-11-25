import type {OrderConfirmation} from "@/types/order";
import {ORDER_STORAGE_KEY} from "./constants";
import {isValidEmail} from "./validation";
import {parseInvoiceReceipt} from "./invoiceReceipt";
import {isOrderReference} from "./orderReference";

let memory: OrderConfirmation | null = null;
let pendingInvoiceDownload: string | undefined;

export function parseOrderConfirmation(value: unknown): OrderConfirmation | null {
  if (!value || typeof value !== "object") return null;
  const order = value as Partial<OrderConfirmation>;
  if (!isOrderReference(order.orderNumber)
    || (order.paymentMethod !== "CARD" && order.paymentMethod !== "INVOICE")
    || typeof order.email !== "string" || !isValidEmail(order.email)) return null;
  const invoice = order.invoice === undefined ? undefined : parseInvoiceReceipt(order.invoice);
  if (invoice === null) return null;
  const totalAmount = typeof order.totalAmount === "number" && Number.isFinite(order.totalAmount) && order.totalAmount > 0
    ? order.totalAmount : undefined;
  return {orderNumber: order.orderNumber, paymentMethod: order.paymentMethod, email: order.email,
    paymentPending: order.paymentMethod === "CARD", totalAmount, ...(invoice ? {invoice} : {})};
}

export function rememberOrderConfirmation(order: OrderConfirmation,
  storage: () => Pick<Storage, "setItem"> & Partial<Pick<Storage, "removeItem">> = () => window.sessionStorage) {
  memory = parseOrderConfirmation(order);
  pendingInvoiceDownload = memory?.invoice ? memory.orderNumber : undefined;
  try {
    storage().setItem(ORDER_STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // Keep the current confirmation in memory and discard an older stored confirmation if possible.
    try {storage().removeItem?.(ORDER_STORAGE_KEY);} catch { /* Storage may be entirely unavailable. */ }
  }
}

export function takeAutomaticInvoiceDownload(reference: string) {
  if (pendingInvoiceDownload !== reference) return false;
  pendingInvoiceDownload = undefined;
  return true;
}

export function readOrderConfirmation(storage: () => Pick<Storage, "getItem"> = () => window.sessionStorage): OrderConfirmation | null {
  if (memory) return memory;
  try {
    const raw = storage().getItem(ORDER_STORAGE_KEY);
    return raw ? parseOrderConfirmation(JSON.parse(raw)) : memory;
  } catch {return memory;}
}

export function rememberInvoiceEmailStatus(reference: string, status: NonNullable<OrderConfirmation["invoice"]>["emailStatus"]) {
  const order = readOrderConfirmation();
  if (!order?.invoice || order.orderNumber !== reference) return;
  memory = {...order, invoice: {...order.invoice, emailStatus: status}};
  try {window.sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(memory));} catch { /* The current confirmation is kept in memory. */ }
}
