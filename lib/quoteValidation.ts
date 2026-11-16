import {isValidEmail, isValidPersonName, isValidPhone} from "./validation";

export const QUOTE_LIMITS = {name: 120, phone: 12, email: 254, company: 180, message: 2000, website: 200} as const;
export type QuoteField = keyof typeof QUOTE_LIMITS | "consent";
export type QuoteErrors = Partial<Record<QuoteField, string>>;

export function normalizeRussianPhone(value: string) {
  const phone = value.trim();
  if (!phone) return "";
  if (phone === "+") return "+7";
  if (!/^\+?\d*$/.test(phone) && !isValidPhone(phone)) return value;
  const digits = phone.replace(/\D/g, "");
  if (phone.startsWith("+") && !digits.startsWith("7")) return value;
  const national = /^[78]/.test(digits) ? digits.slice(1) : digits;
  return national.length <= 10 && (!national || national.startsWith("9")) ? `+7${national}` : value;
}

export function validateQuoteFields(value: Record<string, unknown>): QuoteErrors {
  const errors: QuoteErrors = {};
  const field = (key: keyof typeof QUOTE_LIMITS) => typeof value[key] === "string" ? value[key] as string : "";
  const required = (key: keyof typeof QUOTE_LIMITS, label: string) => {
    const text = field(key);
    if (!text.trim()) errors[key] = `Заполните поле «${label}».`;
    else if (text.length > QUOTE_LIMITS[key]) errors[key] = `${label}: не более ${QUOTE_LIMITS[key]} символов.`;
    return text.trim();
  };
  const name = required("name", "Имя");
  if (!errors.name && !isValidPersonName(name)) errors.name = "Имя должно содержать буквы. Допустимы пробелы, дефис, апостроф и точка.";
  const phone = required("phone", "Телефон");
  if (!phone || phone === "+7") errors.phone = "Заполните поле";
  if (!errors.phone && !/^\+79\d{9}$/.test(phone)) errors.phone = "Неверный формат";
  const email = required("email", "Электронная почта");
  if (!email) errors.email = "Заполните поле";
  if (!errors.email && !isValidEmail(email)) errors.email = "Неверный формат. Пример: name@example.ru";
  required("message", "Что требуется рассчитать?");
  if (!field("message").trim()) errors.message = "Заполните поле";
  for (const key of ["company", "website"] as const) {
    if (value[key] !== undefined && value[key] !== null && typeof value[key] !== "string") errors[key] = `Некорректное значение поля «${key === "company" ? "Компания" : "Сайт"}».`;
    else if (field(key).length > QUOTE_LIMITS[key]) errors[key] = `${key === "company" ? "Компания" : "Сайт"}: не более ${QUOTE_LIMITS[key]} символов.`;
  }
  if (value.consent !== true) errors.consent = "Подтвердите согласие на обработку персональных данных.";
  return errors;
}
