export const QUOTE_LIMITS = {name: 120, phone: 12, email: 254, company: 180, message: 2000, website: 200} as const;
export type QuoteField = keyof typeof QUOTE_LIMITS | "consent";
export type QuoteErrors = Partial<Record<QuoteField, string>>;

export function normalizeRussianPhone(value: string) {
  if (!value) return "";
  let digits = value.replace(/\D/g, "");
  if (!digits) return "+7";
  if (digits.startsWith("7") || digits.startsWith("8")) digits = digits.slice(1);
  return `+7${digits.slice(0, 10)}`;
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
  if (!errors.name && !/^[\p{L}][\p{L}\p{M} .’'-]*$/u.test(name)) errors.name = "Имя должно содержать буквы; допустимы пробелы, дефис, апостроф и точка.";
  const phone = required("phone", "Телефон");
  if (!phone || phone === "+7") errors.phone = "Заполните поле";
  if (!errors.phone && !/^\+79\d{9}$/.test(phone)) errors.phone = "Неверный формат";
  const email = required("email", "Электронная почта");
  if (!email) errors.email = "Заполните поле";
  if (!errors.email && !validEmail(email)) errors.email = "Неверный формат. Пример: name@example.ru";
  required("message", "Что требуется рассчитать?");
  if (!field("message").trim()) errors.message = "Заполните поле";
  for (const key of ["company", "website"] as const) {
    if (value[key] !== undefined && value[key] !== null && typeof value[key] !== "string") errors[key] = `Некорректное значение поля «${key === "company" ? "Компания" : "Сайт"}».`;
    else if (field(key).length > QUOTE_LIMITS[key]) errors[key] = `${key === "company" ? "Компания" : "Сайт"}: не более ${QUOTE_LIMITS[key]} символов.`;
  }
  if (value.consent !== true) errors.consent = "Подтвердите согласие на обработку персональных данных.";
  return errors;
}

function validEmail(value: string) {
  const parts = value.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length > 64 || !/^[a-z\d.!#$%&'*+/=?^_`{|}~-]+$/i.test(local) || local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  const labels = domain.split(".");
  return labels.length >= 2 && labels.every(label => label.length <= 63 && /^[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?$/u.test(label));
}
