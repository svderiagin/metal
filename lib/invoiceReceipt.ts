import type {InvoiceBuyerField, InvoiceEmailStatus, InvoiceReceipt} from "@/types/invoice";
import {isInvoiceNumber} from "./invoiceNumber";

export function isInvoiceEmailStatus(value: unknown): value is InvoiceEmailStatus {
  return value === "PENDING" || value === "SENT" || value === "FAILED";
}

export function isInvoiceBuyerField(value: unknown): value is InvoiceBuyerField {
  return value === "fullName" || value === "companyName" || value === "legalAddress" || value === "deliveryAddress";
}

export function parseInvoiceReceipt(value: unknown): InvoiceReceipt | null {
  if (!value || typeof value !== "object") return null;
  const invoice = value as Partial<InvoiceReceipt>;
  if (!isInvoiceNumber(invoice.number)
    || typeof invoice.downloadToken !== "string" || !/^[a-f0-9]{64}$/.test(invoice.downloadToken)
    || !isInvoiceEmailStatus(invoice.emailStatus)) return null;
  const paymentDueDate = typeof invoice.paymentDueDate === "string"
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(invoice.paymentDueDate)
    && Number.isFinite(Date.parse(invoice.paymentDueDate)) ? invoice.paymentDueDate : undefined;
  return {number: invoice.number, downloadToken: invoice.downloadToken, emailStatus: invoice.emailStatus, paymentDueDate};
}
