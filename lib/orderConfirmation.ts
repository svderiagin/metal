import type {OrderConfirmation} from "@/types/order";
import {ORDER_STORAGE_KEY} from "./constants";
import {isValidEmail} from "./validation";

let memory: OrderConfirmation | null = null;

export function parseOrderConfirmation(value: unknown): OrderConfirmation | null {
  if (!value || typeof value !== "object") return null;
  const order = value as Partial<OrderConfirmation>;
  if (typeof order.orderNumber !== "string" || !/^MS-[A-F0-9]{12}$/.test(order.orderNumber)
    || (order.paymentMethod !== "CARD" && order.paymentMethod !== "INVOICE")
    || typeof order.email !== "string" || !isValidEmail(order.email)) return null;
  return {orderNumber: order.orderNumber, paymentMethod: order.paymentMethod, email: order.email,
    paymentPending: order.paymentMethod === "CARD"};
}

export function rememberOrderConfirmation(order: OrderConfirmation, storage = () => window.sessionStorage) {
  memory = parseOrderConfirmation(order);
  try {storage().setItem(ORDER_STORAGE_KEY, JSON.stringify(memory));} catch { /* Client navigation retains the confirmed order in memory. */ }
}

export function readOrderConfirmation(storage = () => window.sessionStorage): OrderConfirmation | null {
  try {
    const raw = storage().getItem(ORDER_STORAGE_KEY);
    return raw ? parseOrderConfirmation(JSON.parse(raw)) : memory;
  } catch {return memory;}
}
