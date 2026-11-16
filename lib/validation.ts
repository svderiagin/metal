export function normalizeEmail(value: string) {
  const email = value.trim();
  // Unicode case mapping can change an internationalized address and its UTF-8 length.
  return /^\p{ASCII}*$/u.test(email) ? email.toLowerCase() : email;
}

export function isValidEmail(value: string) {
  const email = value.trim();
  const [local, domain, extra] = email.split("@");
  if (email.length > 254 || !local || !domain || extra !== undefined
    || new TextEncoder().encode(local).length > 64 || local.startsWith(".") || local.endsWith(".") || local.includes("..")
    || !/^[\p{L}\p{M}\p{N}.!#$%&'*+/=?^_`{|}~-]+$/u.test(local)) return false;
  const labels = domain.split(".");
  return labels.length >= 2 && labels.every(label =>
    label.length <= 63 && /^[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?$/u.test(label));
}

export function isValidPhone(value: string) {
  const phone = value.trim().replace(/[\u00a0\u202f]/g, " ");
  if (phone.length > 30
    || !/^\+?(?:\d(?:[\d -]*\d)?|(?:\d[\d -]*)?\(\d+\)(?:[ -]*\d(?:[\d -]*\d)?)?)$/.test(phone)) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15 && !(phone.startsWith("+") && digits.startsWith("0"));
}

export function isValidPersonName(value: string) {
  return /^[\p{L}][\p{L}\p{M}\p{Zs}.’'\u2010\u2011-]*$/u.test(value.trim());
}

const innWeights = [2, 4, 10, 3, 5, 9, 4, 6, 8];

export function isValidCompanyInn(value: string) {
  const inn = value.trim();
  if (!/^\d{10}$/.test(inn) || inn.startsWith("00")) return false;
  const weightedSum = innWeights.reduce((sum, weight, index) => sum + weight * Number(inn[index]), 0);
  return (weightedSum % 11) % 10 === Number(inn[9]);
}
