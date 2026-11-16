import type {CheckoutFormData, CreateOrderInput, OrderItemInput} from "@/types/order";
import {isValidCompanyInn, isValidEmail, isValidPersonName, isValidPhone, normalizeEmail} from "./validation";

export const CHECKOUT_LIMITS = {fullName: 120, email: 254, phone: 30, companyName: 180,
  taxNumber: 20, legalAddress: 300, deliveryAddress: 300, comment: 1000} as const;
export type CheckoutFieldErrors = Partial<Record<keyof CheckoutFormData, string>>;
const companyFields = new Set<keyof CheckoutFormData>(["companyName", "taxNumber", "legalAddress"]);
const singleLine = (value: string) => value.trim().replace(/\s+/g, " ");

export function isCheckoutPaymentAvailable(method: unknown): method is "INVOICE" {
  return method === "INVOICE";
}

export function isCheckoutFormValid(form: CheckoutFormData): boolean {
  return Object.keys(getCheckoutFieldErrors(form)).length === 0;
}

export function getCheckoutFieldErrors(form: CheckoutFormData): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};
  if (!isValidPersonName(form.fullName)) errors.fullName = "Введите ФИО буквами.";
  if (!isValidEmail(form.email)) errors.email = "Введите корректный адрес электронной почты.";
  if (!isValidPhone(form.phone)) errors.phone = "Введите корректный телефон с 10–15 цифрами.";
  if (!form.deliveryAddress.trim()) errors.deliveryAddress = "Укажите адрес доставки.";
  if (form.customerType === "COMPANY") {
    if (!form.companyName.trim()) errors.companyName = "Укажите название компании.";
    if (!isValidCompanyInn(form.taxNumber)) errors.taxNumber = "Введите корректный ИНН организации из 10 цифр.";
    if (!form.legalAddress.trim()) errors.legalAddress = "Укажите юридический адрес.";
  }
  for (const [key, maximum] of Object.entries(CHECKOUT_LIMITS)) {
    const field = key as keyof typeof CHECKOUT_LIMITS;
    if (form.customerType !== "COMPANY" && companyFields.has(field)) continue;
    if (!errors[field] && form[field].trim().length > maximum) errors[field] = `Максимум ${maximum} символов.`;
  }
  if (!form.consentAccepted) errors.consentAccepted = "Подтвердите согласие на обработку персональных данных.";
  if (!isCheckoutPaymentAvailable(form.paymentMethod)) errors.paymentMethod = "Выберите счёт на оплату.";
  if (form.customerType !== "INDIVIDUAL" && form.customerType !== "COMPANY") errors.customerType = "Выберите тип покупателя.";
  return errors;
}

export function createOrderInput(form: CheckoutFormData, items: OrderItemInput[]): CreateOrderInput {
  return {items, consent: form.consentAccepted,
    customer: {type: form.customerType, fullName: singleLine(form.fullName), email: normalizeEmail(form.email),
      phone: singleLine(form.phone), ...(form.customerType === "COMPANY" ? {
        companyName: singleLine(form.companyName), taxNumber: form.taxNumber.trim(), legalAddress: singleLine(form.legalAddress),
      } : {})},
    delivery: {address: singleLine(form.deliveryAddress), comment: singleLine(form.comment) || undefined},
    paymentMethod: form.paymentMethod};
}
