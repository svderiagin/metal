import type {ContactRequest, QuoteRequest} from "@/types/forms";
import type {CheckoutFormData, CreateOrderInput, CustomerType, PaymentMethod} from "@/types/order";
import {createOrderInput, isCheckoutFormValid} from "@/lib/checkout";
import {validateContactFields} from "@/lib/contactValidation";
import {validateQuoteFields} from "@/lib/quoteValidation";
import {normalizePieceOrder} from "@/lib/profilePipe";

const productIdPattern = /^[a-zA-Z0-9-]{1,80}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringField = (value: unknown) => typeof value === "string" ? value : "";
const singleLine = (value: unknown) => stringField(value).trim().replace(/\s+/g, " ");

const isCustomerType = (value: unknown): value is CustomerType =>
  value === "INDIVIDUAL" || value === "COMPANY";

const isPaymentMethod = (value: unknown): value is PaymentMethod =>
  value === "CARD" || value === "INVOICE";

export function parseCreateOrderInput(value: unknown): CreateOrderInput | null {
  if (!isRecord(value) || !Array.isArray(value.items) || !isRecord(value.customer) || !isRecord(value.delivery)) return null;
  if (value.consent !== true || value.items.length < 1 || value.items.length > 100) return null;
  const items: CreateOrderInput["items"] = [];
  const productIds = new Set<string>();
  for (const item of value.items) {
    if (!isRecord(item) || typeof item.productId !== "string" || !productIdPattern.test(item.productId)) return null;
    if (productIds.has(item.productId)) return null;
    productIds.add(item.productId);
    const measurement = parseMeasurement(item.measurement);
    const pieceOrder = normalizePieceOrder(item.pieceOrder);
    if (item.measurement !== undefined && !measurement) return null;
    if (item.pieceOrder !== undefined && !pieceOrder || pieceOrder && measurement) return null;
    if (typeof item.quantity !== "number" || !Number.isFinite(item.quantity) || item.quantity <= 0) return null;
    if (!measurement && !pieceOrder && item.quantity > 999) return null;
    items.push({
      productId: item.productId,
      quantity: item.quantity,
      ...(measurement ? {measurement} : {}),
      ...(pieceOrder ? {pieceOrder} : {}),
    });
  }
  if (!isCustomerType(value.customer.type) || !isPaymentMethod(value.paymentMethod)) return null;
  if (value.delivery.comment != null && typeof value.delivery.comment !== "string") return null;
  const form: CheckoutFormData = {
    customerType: value.customer.type,
    paymentMethod: value.paymentMethod,
    consentAccepted: true,
    fullName: stringField(value.customer.fullName),
    email: stringField(value.customer.email),
    phone: stringField(value.customer.phone),
    companyName: stringField(value.customer.companyName),
    taxNumber: stringField(value.customer.taxNumber),
    legalAddress: stringField(value.customer.legalAddress),
    deliveryAddress: stringField(value.delivery.address),
    comment: stringField(value.delivery.comment),
  };
  return isCheckoutFormValid(form) ? createOrderInput(form, items) : null;
}

function parseMeasurement(value: unknown): CreateOrderInput["items"][number]["measurement"] | null {
  if (!isRecord(value)) return null;
  if (value.inputMode !== "meter" && value.inputMode !== "ton") return null;
  if (!positiveFinite(value.meters) || !positiveFinite(value.weightTons)) return null;
  return {
    inputMode: value.inputMode,
    meters: value.meters,
    weightTons: value.weightTons,
  };
}

function positiveFinite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function parseContactRequest(value: unknown): ContactRequest | null {
  if (!isRecord(value) || Object.keys(validateContactFields(value)).length) return null;
  return {name: singleLine(value.name), email: stringField(value.email).trim().toLowerCase(),
    phone: singleLine(value.phone) || undefined, message: singleLine(value.message), consent: true,
    website: singleLine(value.website) || undefined};
}

export function parseQuoteRequest(value: unknown): QuoteRequest | null {
  if (!isRecord(value) || Object.keys(validateQuoteFields(value)).length) return null;
  return {
    name: (value.name as string).trim(), phone: (value.phone as string).trim(),
    email: (value.email as string).trim().toLowerCase(),
    company: typeof value.company === "string" ? value.company.trim() || undefined : undefined,
    message: (value.message as string).trim(), consent: true,
    website: typeof value.website === "string" ? value.website.trim() || undefined : undefined,
  };
}
