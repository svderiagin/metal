export type InvoiceEmailStatus = "PENDING" | "SENT" | "FAILED";
export type InvoiceBuyerField = "fullName" | "companyName" | "legalAddress" | "deliveryAddress";

export interface InvoiceReceipt {
  number: string;
  paymentDueDate?: string;
  downloadToken: string;
  emailStatus: InvoiceEmailStatus;
}

// Stored only on the server. The PDF is fixed at issue time, including seller details and tax.
export interface StoredInvoice {
  number: string;
  paymentDueDate?: string;
  fileName: string;
  pdfBase64: string;
  pdfHash?: string;
  accessTokenHash: string;
  emailStatus: InvoiceEmailStatus;
}
