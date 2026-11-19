import type {CheckoutFormData, CreateOrderInput, OrderItemInput} from "@/types/order";
import {hasPhoneSyntax, isValidCompanyInn, isValidPersonalInn, isValidEmail, isValidPersonName, normalizeEmail} from "./validation";
import {parsePhoneNumberFromString} from "libphonenumber-js";

export const CHECKOUT_LIMITS = {fullName: 120, email: 254, phone: 30, companyName: 180,
  taxNumber: 20, legalAddress: 300, deliveryAddress: 300, comment: 1000} as const;
export type CheckoutFieldErrors = Partial<Record<keyof CheckoutFormData, string>>;
export type CheckoutTextField = keyof typeof CHECKOUT_LIMITS;
const companyFields = new Set<keyof CheckoutFormData>(["companyName", "taxNumber", "legalAddress"]);
const singleLine = (value: string) => value.trim().replace(/\s+/g, " ");
const containsLetter = (value: string) => /\p{L}/u.test(value);
const normalizeInn = (value: string) => value.replace(/\s/gu, "");

function parseCheckoutPhone(value: string) {
  const phone = value.trim().replace(/\p{Zs}/gu, " ").replace(/[\u2010-\u2013]/g, "-");
  if (phone.length > CHECKOUT_LIMITS.phone || !hasPhoneSyntax(phone)) return null;
  const digits = phone.replace(/\D/g, "");
  const national = /^\d{10}$/.test(digits) ? digits : /^[78]\d{10}$/.test(digits) ? digits.slice(1) : null;
  const canonical = phone.startsWith("+") ? `+${digits}` : national && `+7${national}`;
  if (!canonical || !/^\+[1-9]\d{1,14}$/.test(canonical)) return null;
  const parsed = parsePhoneNumberFromString(canonical, {extract: false});
  return parsed?.number === canonical && parsed.isValid() ? parsed : null;
}

export function formatCheckoutField(field: CheckoutTextField, value: string) {
  if (field === "phone") return parseCheckoutPhone(value)?.formatInternational() ?? value;
  if (field === "email") return normalizeEmail(value);
  if (field === "taxNumber") return normalizeInn(value);
  return field === "comment" ? value.trim() : singleLine(value);
}

export function isCheckoutPaymentAvailable(method: unknown): method is "INVOICE" {
  return method === "INVOICE";
}

export function isCheckoutFormValid(form: CheckoutFormData): boolean {
  return Object.keys(getCheckoutFieldErrors(form)).length === 0;
}

export function getCheckoutFieldErrors(form: CheckoutFormData): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};
  if (!isValidPersonName(form.fullName) || !/\p{L}\p{M}*$/u.test(form.fullName.trim())) errors.fullName = "Введите ФИО буквами.";
  if (!isValidEmail(form.email)) errors.email = "Введите корректный адрес электронной почты.";
  if (!parseCheckoutPhone(form.phone)) errors.phone = "Проверьте номер и код страны. Например, +7 900 000-00-00.";
  if (!containsLetter(form.deliveryAddress)) errors.deliveryAddress = "Укажите населённый пункт и адрес доставки.";
  if (form.customerType === "COMPANY") {
    if (!containsLetter(form.companyName)) errors.companyName = "Укажите название организации или имя ИП.";
    const inn = normalizeInn(form.taxNumber);
    if (!isValidCompanyInn(inn) && !isValidPersonalInn(inn)) errors.taxNumber = "Проверьте ИНН. У организации 10 цифр, у ИП 12.";
    if (!containsLetter(form.legalAddress)) errors.legalAddress = "Укажите адрес регистрации.";
  }
  for (const [key, maximum] of Object.entries(CHECKOUT_LIMITS)) {
    const field = key as keyof typeof CHECKOUT_LIMITS;
    if (form.customerType !== "COMPANY" && companyFields.has(field)) continue;
    if (!errors[field] && form[field].trim().length > maximum) errors[field] = `Максимум ${maximum} символов.`;
    if (!errors[field] && /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(form[field])) errors[field] = "Удалите недопустимые символы.";
  }
  if (!form.consentAccepted) errors.consentAccepted = "Подтвердите согласие на обработку персональных данных.";
  if (!isCheckoutPaymentAvailable(form.paymentMethod)) errors.paymentMethod = "Выберите счёт на оплату.";
  if (form.customerType !== "INDIVIDUAL" && form.customerType !== "COMPANY") errors.customerType = "Выберите тип покупателя.";
  return errors;
}

export function createOrderInput(form: CheckoutFormData, items: OrderItemInput[]): CreateOrderInput {
  return {items, consent: form.consentAccepted,
    customer: {type: form.customerType, fullName: singleLine(form.fullName), email: normalizeEmail(form.email),
      phone: parseCheckoutPhone(form.phone)?.number ?? singleLine(form.phone), ...(form.customerType === "COMPANY" ? {
        companyName: singleLine(form.companyName), taxNumber: normalizeInn(form.taxNumber), legalAddress: singleLine(form.legalAddress),
      } : {})},
    delivery: {address: singleLine(form.deliveryAddress), comment: singleLine(form.comment) || undefined},
    paymentMethod: form.paymentMethod};
}
