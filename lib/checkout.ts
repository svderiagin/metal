import type {CheckoutFormData, CreateOrderInput, OrderItemInput} from "@/types/order";
import {isValidCompanyInn, isValidPersonalInn, isValidEmail} from "./validation";
import {formatCheckoutPhoneDraft, isCheckoutPhonePrefix, MAX_CHECKOUT_PHONE_LENGTH, parseCheckoutPhone} from "./checkoutPhone";
import {isInvoiceBuyerField} from "./invoiceReceipt";

export const MAX_CHECKOUT_ITEMS = 100;
export const CHECKOUT_LIMITS = {fullName: 120, email: 254, phone: MAX_CHECKOUT_PHONE_LENGTH, companyName: 180,
  taxNumber: 12, legalAddress: 300, deliveryAddress: 300, comment: 1000} as const;
export type CheckoutFieldErrors = Partial<Record<keyof CheckoutFormData, string>>;
export type CheckoutTextField = keyof typeof CHECKOUT_LIMITS;
const companyFields = new Set<keyof CheckoutFormData>(["companyName", "taxNumber", "legalAddress"]);
const singleLine = (value: string) => value.trim().replace(/\s+/g, " ");
const containsLetter = (value: string) => /\p{L}/u.test(value);
const unsupportedControls = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
// Accept initials and common name separators.
const checkoutNamePattern = /^\p{L}[\p{L}\p{M}]*(?:(?:\p{Zs}+|['’·・゠\u2010\u2011-]|\.\p{Zs}*)\p{L}[\p{L}\p{M}]*)*\.?$/u;
const invoiceLetter = /[\p{Script=Cyrillic}\p{Script=Latin}]/u;

function normalizeCheckoutEmail(value: string) {
  const email = value.trim().replace(/\s*@\s*/gu, "@");
  const at = email.indexOf("@");
  if (at < 0) return email;
  // The domain is case-insensitive. The mailbox name can be case-sensitive.
  return email.slice(0, at + 1) + email.slice(at + 1).toLowerCase();
}

function normalizeCheckoutInn(value: string) {
  const inn = value.trim().replace(/^ИНН(?:\s*:\s*|\s+)/iu, "");
  return /^\d+(?:[\p{Zs}\t\r\n\u2010\u2011-]+\d+)*$/u.test(inn) ? inn.replace(/\D/g, "") : inn;
}

function checkoutEmailError(email: string) {
  if (!email) return "Введите электронную почту.";
  if (!email.includes("@")) return "Добавьте знак @. Пример: name@example.com.";
  const [local, domain, extra] = email.split("@");
  if (extra !== undefined) return "Укажите один адрес электронной почты.";
  if (!local) return "Укажите имя почтового ящика перед знаком @.";
  if (!domain || !domain.includes(".")) return "Укажите полный домен после знака @. Пример: example.com.";
  if (!isValidEmail(email)) return "Проверьте адрес электронной почты. Пример: name@example.com.";
}

function hasAddressDetails(value: string) {
  const address = value.replace(/^(?:г(?:ород)?|с(?:ело)?|д(?:еревня)?|пос(?:[её]лок)?)(?:\.\s*|\s+)/iu, "");
  const parts = address.match(/[\p{L}\p{N}]+(?:[-/\u2010\u2011][\p{L}\p{N}]+)*/gu);
  return containsLetter(address) && (parts?.length ?? 0) >= 2;
}

export function formatCheckoutField(field: CheckoutTextField, value: string) {
  if (unsupportedControls.test(value)) return value;
  if (field === "phone") {
    if (isCheckoutPhonePrefix(value)) return "";
    const phone = parseCheckoutPhone(value);
    return phone ? formatCheckoutPhoneDraft(phone.number) ?? phone.formatInternational() : value;
  }
  if (field === "email") return normalizeCheckoutEmail(singleLine(value));
  if (field === "taxNumber") return normalizeCheckoutInn(value);
  return field === "comment" ? value.replace(/\r\n?/g, "\n").trim() : singleLine(value);
}

export function isCheckoutPaymentAvailable(method: unknown): method is "INVOICE" {
  return method === "INVOICE";
}

export function isCheckoutFormValid(form: CheckoutFormData): boolean {
  return Object.keys(getCheckoutFieldErrors(form)).length === 0;
}

export function getCheckoutFieldErrors(form: CheckoutFormData): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};
  for (const [key, maximum] of Object.entries(CHECKOUT_LIMITS)) {
    const field = key as keyof typeof CHECKOUT_LIMITS;
    if (form.customerType !== "COMPANY" && companyFields.has(field)) continue;
    const raw = form[field];
    const value = field === "phone" ? raw.trim() : formatCheckoutField(field, raw);
    if (unsupportedControls.test(raw)) errors[field] = "Удалите недопустимые символы.";
    else if (value.length > maximum && field !== "taxNumber") errors[field] = `Максимум ${maximum} символов.`;
    else if (isInvoiceBuyerField(field) && [...value].some(letter => /\p{L}/u.test(letter) && !invoiceLetter.test(letter))) {
      errors[field] = "Используйте кириллицу или латиницу, как указано в документах.";
    }
    if (errors[field]) continue;

    let message: string | undefined;
    switch (field) {
      case "fullName":
        if (!value) message = "Введите ФИО.";
        else if (!checkoutNamePattern.test(value)) message = "Проверьте ФИО. Уберите цифры и лишние знаки.";
        break;
      case "email":
        message = checkoutEmailError(value);
        break;
      case "phone":
        if (!value || isCheckoutPhonePrefix(value)) message = "Введите номер телефона.";
        else if (!parseCheckoutPhone(value)) message = "Проверьте номер телефона. Пример: +7 916 123 45 67.";
        break;
      case "companyName":
        if (!containsLetter(value) || /^(?:ООО|ИП|АО|ПАО|ОАО|ЗАО)\.?$/iu.test(value)) {
          message = "Укажите название организации или ФИО ИП.";
        }
        break;
      case "taxNumber":
        if (!value) message = "Введите ИНН.";
        else if (!/^\d+$/.test(value)) message = "В ИНН должны быть только цифры.";
        else if (value.length !== 10 && value.length !== 12) message = "Укажите 10 цифр для организации или 12 для ИП.";
        else if (!isValidCompanyInn(value) && !isValidPersonalInn(value)) message = "Проверьте цифры ИНН. Контрольная сумма не совпадает.";
        break;
      case "legalAddress":
        if (!hasAddressDetails(value)) message = "Укажите адрес регистрации целиком.";
        break;
      case "deliveryAddress":
        if (!hasAddressDetails(value)) message = "Уточните адрес доставки. Добавьте улицу и дом или название объекта.";
        break;
    }
    if (message) errors[field] = message;
  }
  if (!form.consentAccepted) errors.consentAccepted = "Подтвердите согласие на обработку персональных данных.";
  if (!isCheckoutPaymentAvailable(form.paymentMethod)) errors.paymentMethod = "Выберите счёт на оплату.";
  if (form.customerType !== "INDIVIDUAL" && form.customerType !== "COMPANY") errors.customerType = "Выберите тип покупателя.";
  return errors;
}

export function createOrderInput(form: CheckoutFormData, items: OrderItemInput[]): CreateOrderInput {
  return {items, consent: form.consentAccepted,
    customer: {type: form.customerType, fullName: formatCheckoutField("fullName", form.fullName), email: formatCheckoutField("email", form.email),
      phone: parseCheckoutPhone(form.phone)?.number ?? singleLine(form.phone), ...(form.customerType === "COMPANY" ? {
        companyName: formatCheckoutField("companyName", form.companyName), taxNumber: formatCheckoutField("taxNumber", form.taxNumber),
        legalAddress: formatCheckoutField("legalAddress", form.legalAddress),
      } : {})},
    delivery: {address: formatCheckoutField("deliveryAddress", form.deliveryAddress), comment: formatCheckoutField("comment", form.comment) || undefined},
    paymentMethod: form.paymentMethod};
}
