import type {CreateOrderInput, CreateOrderResponse} from "@/types/order";
import type {InvoiceBuyerField} from "@/types/invoice";
import {isApiSuccess, readApiError} from "./apiResponse";
import {isInvoiceBuyerField, isInvoiceEmailStatus, parseInvoiceReceipt} from "./invoiceReceipt";
import {isOrderReference} from "./orderReference";

const checkoutAttemptKey = "metal-store-checkout-attempt-v1";
type CheckoutAttempt = {fingerprint: string; key: string};
const sha256Hex = /^[a-f0-9]{64}$/u;
let checkoutAttempts: Map<string, CheckoutAttempt> | undefined;

function readCheckoutAttempts() {
  if (checkoutAttempts) return checkoutAttempts;
  const attempts = new Map<string, CheckoutAttempt>();
  try {
    const saved: unknown = JSON.parse(window.sessionStorage.getItem(checkoutAttemptKey) ?? "null");
    for (const value of Array.isArray(saved) ? saved : [saved]) {
      const attempt = value as Partial<CheckoutAttempt> | null;
      if (typeof attempt?.key === "string" && sha256Hex.test(attempt.key)
        && typeof attempt.fingerprint === "string" && sha256Hex.test(attempt.fingerprint)) {
        attempts.set(attempt.fingerprint, {key: attempt.key, fingerprint: attempt.fingerprint});
      }
    }
  } catch { /* The current attempt also stays in memory if storage is unavailable. */ }
  checkoutAttempts = attempts;
  return attempts;
}

function saveCheckoutAttempts(attempts: Map<string, CheckoutAttempt>) {
  try {window.sessionStorage.setItem(checkoutAttemptKey, JSON.stringify([...attempts.values()]));}
  catch { /* In-memory retry remains available. */ }
}

const toHex = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");

async function getCheckoutAttempt(input: CreateOrderInput) {
  const fingerprint = toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(input)))));
  const attempts = readCheckoutAttempts();
  const previous = attempts.get(fingerprint);
  if (previous) return previous;
  // An edited checkout must keep the original attempt available in case its response was lost.
  const attempt = {fingerprint, key: toHex(crypto.getRandomValues(new Uint8Array(32)))};
  attempts.set(fingerprint, attempt);
  saveCheckoutAttempts(attempts);
  return attempt;
}

export class CheckoutPriceChanged extends Error {
  constructor(public readonly lineTotals: number[]) {
    super("Цены изменились. Проверьте обновлённую сумму и подтвердите заказ.");
  }
}

export class CheckoutInvoiceTextError extends Error {
  constructor(public readonly field: InvoiceBuyerField, message: string) {
    super(message);
  }
}

export async function createOrder(input: CreateOrderInput, expectedLineTotals: number[]): Promise<CreateOrderResponse> {
  const fallback = "Не удалось создать заказ.";
  const {key, fingerprint} = await getCheckoutAttempt(input);
  const response = await fetch("/api/orders", {method: "POST", headers: {"content-type": "application/json", "Idempotency-Key": key},
    body: JSON.stringify({...input, expectedLineTotals})})
    .catch(() => {throw new Error("Не удалось получить подтверждение заказа. Повторите отправку с теми же данными.");});
  let result: unknown;
  try {result = await response.json();} catch {throw new Error(fallback);}
  if (response.status === 409 && result && typeof result === "object" && "code" in result && result.code === "ORDER_PRICE_CHANGED"
    && "lineTotals" in result && Array.isArray(result.lineTotals) && result.lineTotals.length === input.items.length
    && result.lineTotals.every(value => Number.isSafeInteger(value) && value > 0)) throw new CheckoutPriceChanged(result.lineTotals);
  if (response.status === 422 && result && typeof result === "object" && "code" in result && result.code === "INVOICE_TEXT_UNSUPPORTED"
    && "field" in result && isInvoiceBuyerField(result.field)) {
    throw new CheckoutInvoiceTextError(result.field, readApiError(result, "Уточните написание для счёта."));
  }
  if (!response.ok || !isApiSuccess(result)) throw new Error(readApiError(result, fallback));
  if (!("order" in result) || !isOrderResult(result.order)) throw new Error("Не удалось подтвердить создание заказа.");
  const attempts = readCheckoutAttempts();
  if (attempts.get(fingerprint)?.key === key) {
    attempts.delete(fingerprint);
    saveCheckoutAttempts(attempts);
  }
  return result as unknown as CreateOrderResponse;
}

function isOrderResult(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const order = value as Record<string, unknown>;
  return isOrderReference(order.reference)
    && typeof order.totalAmount === "number" && Number.isFinite(order.totalAmount) && order.totalAmount > 0
    && order.paymentMethod === "INVOICE"
    && parseInvoiceReceipt(order.invoice) !== null;
}

function invoiceRequest(orderReference: string, token: string, method: "GET" | "HEAD", signal?: AbortSignal) {
  return fetch(`/api/orders/${encodeURIComponent(orderReference)}/invoice`, {
    method, signal, headers: {authorization: `Bearer ${token}`}, cache: "no-store", referrerPolicy: "no-referrer",
  });
}

export async function fetchInvoice(orderReference: string, token: string): Promise<Blob> {
  const response = await invoiceRequest(orderReference, token, "GET");
  if (!response.ok || !response.headers.get("content-type")?.startsWith("application/pdf")) {
    throw new Error("Не удалось скачать счёт. Попробуйте ещё раз или свяжитесь с нами, указав номер заказа.");
  }
  const pdf = await response.blob();
  if (await pdf.slice(0, 5).text() !== "%PDF-") throw new Error("Скачанный счёт повреждён.");
  return pdf;
}

export async function fetchInvoiceEmailStatus(orderReference: string, token: string, signal: AbortSignal) {
  const response = await invoiceRequest(orderReference, token, "HEAD", signal);
  const status = response.headers.get("X-Invoice-Email-Status");
  return response.ok && isInvoiceEmailStatus(status) ? status : undefined;
}
