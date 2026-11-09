import type {CreateOrderInput, CreateOrderResponse, CreatePaymentResponse} from "@/types/order";
import {isApiSuccess, readApiError} from "./apiResponse";
import {parseInvoiceReceipt} from "./invoiceReceipt";

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResponse> {
  const result = await post("/api/orders", input, "Не удалось создать заказ.");
  if (!("order" in result) || !isOrderResult(result.order)) throw new Error("Не удалось подтвердить создание заказа.");
  return result as unknown as CreateOrderResponse;
}

export async function createPayment(orderReference: string): Promise<CreatePaymentResponse> {
  try {
    const result = await post("/api/payments/create", {orderReference}, "Онлайн-оплата пока не настроена.");
    if (!("redirectUrl" in result) || typeof result.redirectUrl !== "string" || !isPaymentRedirect(result.redirectUrl)) {
      throw new Error("Сервис оплаты вернул некорректный адрес.");
    }
    return {ok: true, redirectUrl: result.redirectUrl};
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Не удалось перейти к оплате.";
    throw new Error(`${message} Заказ ${orderReference} сохранён; корзина не очищена.`);
  }
}

export function isPaymentRedirect(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {return false;}
}

async function post(url: string, input: unknown, fallback: string) {
  const response = await fetch(url, {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify(input)});
  let result: unknown;
  try {result = await response.json();} catch {throw new Error(fallback);}
  if (!response.ok || !isApiSuccess(result)) throw new Error(readApiError(result, fallback));
  return result;
}

function isOrderResult(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const order = value as Record<string, unknown>;
  return typeof order.reference === "string" && /^MS-[A-F0-9]{12}$/.test(order.reference)
    && typeof order.totalAmount === "number" && Number.isFinite(order.totalAmount) && order.totalAmount > 0
    && (order.paymentMethod === "CARD" || order.paymentMethod === "INVOICE")
    && (order.invoice === undefined || parseInvoiceReceipt(order.invoice, order.reference) !== null);
}

export async function fetchInvoice(orderReference: string, token: string): Promise<Blob> {
  const response = await fetch(`/api/orders/${encodeURIComponent(orderReference)}/invoice`, {
    headers: {authorization: `Bearer ${token}`}, cache: "no-store", referrerPolicy: "no-referrer",
  });
  if (!response.ok || !response.headers.get("content-type")?.startsWith("application/pdf")) {
    throw new Error("Не удалось скачать счёт. Попробуйте ещё раз или свяжитесь с нами, указав номер заказа.");
  }
  return response.blob();
}
