import type {ContactRequest, QuoteRequest} from "@/types/forms";
import type {CreateOrderInput, CustomerType, PaymentMethod} from "@/types/order";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[\d\s()-]{10,24}$/;
const productIdPattern = /^[a-zA-Z0-9-]{1,80}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown, max: number) => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 0 && normalized.length <= max ? normalized : null;
};

const optionalText = (value: unknown, max: number) => {
  if (value === undefined || value === null || value === "") return undefined;
  return text(value, max) ?? null;
};

const isCustomerType = (value: unknown): value is CustomerType =>
  value === "INDIVIDUAL" || value === "COMPANY";

const isPaymentMethod = (value: unknown): value is PaymentMethod =>
  value === "CARD" || value === "INVOICE";

export function parseCreateOrderInput(value: unknown): CreateOrderInput | null {
  if (!isRecord(value) || !Array.isArray(value.items) || !isRecord(value.customer) || !isRecord(value.delivery)) return null;
  if (value.items.length < 1 || value.items.length > 100) return null;
  const items = value.items.flatMap((item) => {
    if (!isRecord(item) || typeof item.productId !== "string" || !productIdPattern.test(item.productId)) return [];
    const measurement = parseMeasurement(item.measurement);
    if (item.measurement !== undefined && !measurement) return [];
    if (typeof item.quantity !== "number" || !Number.isFinite(item.quantity) || item.quantity <= 0) return [];
    if (!measurement && (!Number.isInteger(item.quantity) || item.quantity > 999)) return [];
    return [{
      productId: item.productId,
      quantity: measurement ? item.quantity : Math.floor(item.quantity),
      ...(measurement ? {measurement} : {}),
    }];
  });
  if (items.length !== value.items.length || !isCustomerType(value.customer.type) || !isPaymentMethod(value.paymentMethod)) return null;
  const fullName = text(value.customer.fullName, 120);
  const email = text(value.customer.email, 254);
  const phone = text(value.customer.phone, 30);
  const address = text(value.delivery.address, 300);
  const comment = optionalText(value.delivery.comment, 1000);
  const companyName = optionalText(value.customer.companyName, 180);
  const taxNumber = optionalText(value.customer.taxNumber, 20);
  const legalAddress = optionalText(value.customer.legalAddress, 300);
  if (!fullName || !email || !emailPattern.test(email) || !phone || !phonePattern.test(phone) || !address || comment === null || companyName === null || taxNumber === null || legalAddress === null) return null;
  if (value.customer.type === "COMPANY" && (!companyName || !taxNumber || !legalAddress)) return null;
  return {
    items,
    customer: {
      type: value.customer.type,
      fullName,
      email: email.toLowerCase(),
      phone,
      companyName,
      taxNumber,
      legalAddress
    },
    delivery: {address, comment},
    paymentMethod: value.paymentMethod,
  };
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
  if (!isRecord(value)) return null;
  const name = text(value.name, 120);
  const email = text(value.email, 254);
  const phone = optionalText(value.phone, 30);
  const message = text(value.message, 2000);
  const website = optionalText(value.website, 200);
  if (!name || !email || !emailPattern.test(email) || !message || phone === null || website === null) return null;
  if (phone && !phonePattern.test(phone)) return null;
  return {name, email: email.toLowerCase(), phone, message, website};
}

export function parseQuoteRequest(value: unknown): QuoteRequest | null {
  if (!isRecord(value)) return null;
  const name = text(value.name, 120);
  const phone = text(value.phone, 30);
  const email = text(value.email, 254);
  const company = optionalText(value.company, 180);
  const message = text(value.message, 3000);
  const website = optionalText(value.website, 200);
  if (!name || !phone || !phonePattern.test(phone) || !email || !emailPattern.test(email) || !message || value.consent !== true || company === null || website === null) return null;
  return {name, phone, email: email.toLowerCase(), company, message, consent: true, website};
}
