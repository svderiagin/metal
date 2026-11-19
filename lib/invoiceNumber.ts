export const FIRST_INVOICE_NUMBER = 2677024476;

export function isInvoiceNumber(value: unknown): value is string {
  return typeof value === "string" && /^[1-9]\d{9}$/.test(value);
}

export function invoiceFileName(number: string, reference: string) {
  return isInvoiceNumber(number) ? `Счёт-${number}.pdf` : `invoice-${reference}.pdf`;
}
