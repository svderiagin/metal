import type {CheckoutFormData, CreateOrderInput, OrderItemInput} from "@/types/order";
import {isValidEmail, isValidPhone} from "./validation";

export const CHECKOUT_LIMITS = {fullName: 120, email: 254, phone: 30, companyName: 180,
  taxNumber: 20, legalAddress: 300, deliveryAddress: 300, comment: 1000} as const;

export function isCheckoutFormValid(form: CheckoutFormData): boolean {
  if (!form.consentAccepted || !isValidEmail(form.email) || !isValidPhone(form.phone)) return false;
  if (!form.fullName.trim() || !form.deliveryAddress.trim()) return false;
  if (form.paymentMethod !== "CARD" && form.paymentMethod !== "INVOICE") return false;
  if (form.customerType !== "INDIVIDUAL" && form.customerType !== "COMPANY") return false;
  if (Object.entries(CHECKOUT_LIMITS).some(([key, max]) => form[key as keyof typeof CHECKOUT_LIMITS].trim().length > max)) return false;
  return form.customerType !== "COMPANY" || Boolean(form.companyName.trim() && form.taxNumber.trim() && form.legalAddress.trim());
}

export function createOrderInput(form: CheckoutFormData, items: OrderItemInput[]): CreateOrderInput {
  return {items, consent: form.consentAccepted,
    customer: {type: form.customerType, fullName: form.fullName.trim(), email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(), companyName: form.companyName.trim() || undefined,
      taxNumber: form.taxNumber.trim() || undefined, legalAddress: form.legalAddress.trim() || undefined},
    delivery: {address: form.deliveryAddress.trim(), comment: form.comment.trim() || undefined},
    paymentMethod: form.paymentMethod};
}
