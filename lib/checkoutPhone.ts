import {AsYouType, parsePhoneNumberFromString, validatePhoneNumberLength} from "libphonenumber-js/max";
import {hasPhoneSyntax} from "./validation";

export const CHECKOUT_PHONE_PREFIX = "+7 ";
export const MAX_CHECKOUT_PHONE_LENGTH = 30;

const normalizeSeparators = (value: string) => value.trim().replace(/\p{Zs}/gu, " ").replace(/[\u2010-\u2013]/g, "-");
const digitsOf = (value: string) => value.replace(/\D/g, "");

export function isCheckoutPhonePrefix(value: string) {
  return value.trim() === "+7";
}

export function parseCheckoutPhone(value: string) {
  const phone = normalizeSeparators(value);
  if (phone.length > MAX_CHECKOUT_PHONE_LENGTH || !hasPhoneSyntax(phone)) return null;
  const digits = digitsOf(phone);
  const national = /^\d{10}$/.test(digits) ? digits : /^[78]\d{10}$/.test(digits) ? digits.slice(1) : null;
  const canonical = phone.startsWith("+") ? `+${digits}` : national && `+7${national}`;
  if (!canonical || !/^\+[1-9]\d{1,14}$/.test(canonical)) return null;
  const parsed = parsePhoneNumberFromString(canonical, {extract: false});
  return parsed?.number === canonical && parsed.isValid() ? parsed : null;
}

export function formatCheckoutPhoneDraft(value: string) {
  const phone = normalizeSeparators(value);
  if (phone.length > MAX_CHECKOUT_PHONE_LENGTH || !/^\+?[0-9() -]*$/.test(phone)) return null;
  const digits = digitsOf(phone);
  if (!digits) return phone.startsWith("+") ? "+" : "";

  const canonical = phone.startsWith("+") ? `+${digits}`
    : `+7${/^[78]/.test(digits) && digits.length !== 10 ? digits.slice(1) : digits}`;
  if (canonical.startsWith("+0") || canonical.length > 16 || canonical.startsWith("+7") && canonical.length > 12
    || validatePhoneNumberLength(canonical) === "TOO_LONG") return null;
  if (canonical.startsWith("+7")) {
    const national = canonical.slice(2);
    const groups = [national.slice(0, 3), national.slice(3, 6), national.slice(6, 8), national.slice(8)];
    return CHECKOUT_PHONE_PREFIX + groups.filter(Boolean).join(" ");
  }
  return new AsYouType().input(canonical);
}

export function isCheckoutPhoneReadyForValidation(value: string) {
  const lengthStatus = validatePhoneNumberLength(value);
  return lengthStatus === undefined || lengthStatus === "INVALID_LENGTH"
    || lengthStatus === "INVALID_COUNTRY" && digitsOf(value).length >= 3;
}
