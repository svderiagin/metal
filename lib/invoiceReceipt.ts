import type {InvoiceReceipt} from "@/types/invoice";

export function parseInvoiceReceipt(value: unknown, reference: string): InvoiceReceipt | null {
  if (!value || typeof value !== "object") return null;
  const invoice = value as Partial<InvoiceReceipt>;
  if (invoice.number !== reference || typeof invoice.downloadToken !== "string" || !/^[a-f0-9]{64}$/.test(invoice.downloadToken)
    || (invoice.emailStatus !== "SENT" && invoice.emailStatus !== "FAILED") || typeof invoice.isPreview !== "boolean") return null;
  return {number: invoice.number, downloadToken: invoice.downloadToken, emailStatus: invoice.emailStatus, isPreview: invoice.isPreview};
}
