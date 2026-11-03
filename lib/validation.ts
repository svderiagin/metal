export const isValidEmail = (value: string) => value.trim().length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
export const isValidPhone = (value: string) => /^\+?[\d\s()-]+$/.test(value.trim())
  && value.length <= 30 && /^\d{10,15}$/.test(value.replace(/\D/g, ""));
