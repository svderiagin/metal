export const isValidEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value);
export const isValidPhone = (value: string) => value.replace(/\D/g, "").length >= 10;
