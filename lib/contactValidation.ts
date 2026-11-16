import {isValidEmail, isValidPersonName, isValidPhone} from "./validation";

export const CONTACT_LIMITS = {name: 120, email: 254, phone: 30, message: 2000, website: 200} as const;
export type ContactField = keyof typeof CONTACT_LIMITS | "consent";
export type ContactFieldErrors = Partial<Record<ContactField, string>>;

export function validateContactFields(value: Record<string, unknown>): ContactFieldErrors {
  const errors: ContactFieldErrors = {};
  if (typeof value.name !== "string" || !isValidPersonName(value.name)) errors.name = "Введите имя буквами.";
  if (typeof value.email !== "string" || !isValidEmail(value.email)) errors.email = "Введите корректный адрес электронной почты.";
  if (value.phone != null && (typeof value.phone !== "string" || (value.phone.trim() && !isValidPhone(value.phone)))) {
    errors.phone = "Введите корректный телефон с 10–15 цифрами.";
  }
  if (typeof value.message !== "string" || !value.message.trim()) errors.message = "Введите сообщение.";
  if (value.website != null && typeof value.website !== "string") errors.website = "Некорректное значение поля.";
  if (value.consent !== true) errors.consent = "Подтвердите согласие на обработку персональных данных.";
  for (const [key, maximum] of Object.entries(CONTACT_LIMITS)) {
    const field = key as keyof typeof CONTACT_LIMITS;
    const input = value[field];
    if (!errors[field] && typeof input === "string" && input.trim().length > maximum) {
      errors[field] = `Максимум ${maximum} символов.`;
    }
  }
  return errors;
}
