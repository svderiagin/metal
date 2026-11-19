export function isOrderReference(value: unknown): value is string {
  return typeof value === "string" && /^(?:[1-9]\d{9}|MS-[A-F0-9]{12})$/.test(value);
}
